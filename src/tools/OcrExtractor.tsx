import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, FileText, RotateCcw, Search } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import ProgressBar from '../components/ProgressBar'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { downloadBlob, getImageInfo, type ImageInfo } from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface OcrExtractorProps {
    onBack: () => void
    initialFile?: File | null
}

const LANGUAGES = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'ara', name: 'Arabic' },
    { code: 'hin', name: 'Hindi' },
]

export default function OcrExtractor({ onBack, initialFile }: OcrExtractorProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [extractedText, setExtractedText] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [language, setLanguage] = useState('eng')
    const [copied, setCopied] = useState(false)
    const preview = useObjectUrl(file)
    const workerRef = useRef<{ terminate: () => Promise<unknown> } | null>(null)
    const runIdRef = useRef(0)
    const copyTimerRef = useRef<number | undefined>(undefined)
    const { success, error } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setExtractedText('')
        setProgress(0)
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setExtractedText('')
        setProgress(0)
    }, [])

    useEffect(() => {
        if (!file) return
        let cancelled = false
        void getImageInfo(file)
            .then((info) => {
                if (cancelled) return
                setOriginalInfo(info)
            })
            .catch(() => {
                if (cancelled) return
                setOriginalInfo(null)
            })
        return () => {
            cancelled = true
        }
    }, [file])

    useEffect(() => () => {
        window.clearTimeout(copyTimerRef.current)
        void workerRef.current?.terminate().catch(() => undefined)
    }, [])

    const extractText = async () => {
        if (!file || isProcessing) return

        const runId = ++runIdRef.current
        setIsProcessing(true)
        setProgress(0)
        setExtractedText('')

        try {
            const { default: Tesseract } = await import('tesseract.js')
            if (runIdRef.current !== runId) return
            const worker = await Tesseract.createWorker(language, 1, {
                logger: (message: { status: string; progress: number }) => {
                    if (runIdRef.current === runId && message.status === 'recognizing text') {
                        setProgress(Math.round(message.progress * 100))
                    }
                },
            })
            workerRef.current = worker
            if (runIdRef.current !== runId) {
                await worker.terminate()
                return
            }
            const { data } = await worker.recognize(file)
            if (runIdRef.current !== runId) return
            setExtractedText(data.text.trim())
            setProgress(100)
            success('Text recognized successfully')
        } catch (err) {
            if (runIdRef.current === runId) {
                error(err instanceof Error ? err.message : 'Could not extract text from the image')
            }
        } finally {
            void workerRef.current?.terminate().catch(() => undefined)
            workerRef.current = null
            if (runIdRef.current === runId) setIsProcessing(false)
        }
    }

    const cancelExtraction = () => {
        runIdRef.current += 1
        void workerRef.current?.terminate().catch(() => undefined)
        workerRef.current = null
        setIsProcessing(false)
        setProgress(0)
        success('OCR cancelled')
    }

    const copyText = async () => {
        try {
            await navigator.clipboard.writeText(extractedText)
            setCopied(true)
            success('Text copied to clipboard')
            window.clearTimeout(copyTimerRef.current)
            copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
        } catch {
            error('Clipboard access was blocked by your browser')
        }
    }

    const downloadText = () => {
        downloadBlob(new Blob([extractedText], { type: 'text/plain' }), 'extracted-text.txt')
    }

    const handleReset = () => {
        runIdRef.current += 1
        setFile(null)
        setOriginalInfo(null)
        setExtractedText('')
        setProgress(0)
    }

    const wordCount = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0
    const charCount = extractedText.length

    const leftControls = (
        <>
            {file && (
                <ControlGroup label="Source Image">
                    <FileChip
                        name={file.name}
                        sizeBytes={file.size}
                        width={originalInfo?.width}
                        height={originalInfo?.height}
                        thumbnailUrl={preview || undefined}
                        onRemove={handleReset}
                    />
                </ControlGroup>
            )}

            <ControlGroup label="Recognition Language" hint="Select the primary language of the text">
                <select
                    className="control-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isProcessing}
                >
                    {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>
            </ControlGroup>

            {isProcessing && (
                <ControlGroup label="OCR Status">
                    <ProgressBar
                        progress={progress}
                        stageText={
                            progress < 30
                                ? 'Loading language traineddata…'
                                : progress < 90
                                ? 'Recognizing text glyphs…'
                                : 'Finalizing text structure…'
                        }
                        onCancel={cancelExtraction}
                    />
                </ControlGroup>
            )}

            {extractedText && (
                <ControlGroup label="Extracted Stats">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                        <div className="stat-tile">
                            <span className="stat-tile-label">Words</span>
                            <span className="stat-tile-value">{wordCount}</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-tile-label">Characters</span>
                            <span className="stat-tile-value">{charCount}</span>
                        </div>
                    </div>
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="file-text"
            title="Drop image to extract text"
            hint="Supports screenshots, scanned documents, receipts & invoices"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: extractedText ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
                gap: 'var(--spacing-4)',
                width: '100%',
                maxWidth: '1000px',
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                    Original Document Preview
                </p>
                <img
                    src={preview || undefined}
                    alt="Document preview"
                    style={{
                        maxHeight: '60vh',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                    }}
                />
            </div>

            {extractedText && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>
                            Extracted Text Output
                        </p>
                        <Button variant="ghost" size="sm" onClick={() => void copyText()} icon={copied ? <Check size={13} /> : <Copy size={13} />}>
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </div>
                    <textarea
                        value={extractedText}
                        onChange={(e) => setExtractedText(e.target.value)}
                        style={{
                            width: '100%',
                            flex: 1,
                            minHeight: '260px',
                            maxHeight: '60vh',
                            padding: 'var(--spacing-3)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '13px',
                            lineHeight: 1.6,
                            backgroundColor: 'var(--color-bg-surface-elevated)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border-default)',
                            borderRadius: 'var(--radius-md)',
                            resize: 'vertical',
                        }}
                    />
                </div>
            )}
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Language" value={LANGUAGES.find((l) => l.code === language)?.name ?? language} />
                {extractedText && (
                    <>
                        <StatTile label="Words" value={wordCount} />
                        <StatTile label="Chars" value={charCount} />
                    </>
                )}
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                {!extractedText ? (
                    <Button
                        variant="primary"
                        onClick={() => void extractText()}
                        isLoading={isProcessing}
                        icon={<Search size={15} />}
                    >
                        Extract Text
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => void copyText()}
                            icon={copied ? <Check size={15} /> : <Copy size={15} />}
                        >
                            {copied ? 'Copied' : 'Copy Text'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={downloadText}
                            icon={<Download size={15} />}
                        >
                            Download .txt
                        </Button>
                    </>
                )}
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="OCR Text Extractor"
                toolIcon={<FileText size={18} />}
                toolId="ocr"
                onBack={onBack}
                onReset={file ? handleReset : undefined}
            />
            <WorkspaceLayout
                leftControls={leftControls}
                centerCanvas={centerCanvas}
                bottomBar={bottomBar}
                hasFile={!!file}
            />
        </div>
    )
}
