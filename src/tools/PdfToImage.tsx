import { saveAs } from 'file-saver'
import { useCallback, useEffect, useRef, useState } from 'react'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

interface PdfToImageProps {
    onBack: () => void
}

interface RenderedPage {
    blob: Blob
    url: string
}

const MAX_PDF_BYTES = 50 * 1024 * 1024

export default function PdfToImage({ onBack }: PdfToImageProps) {
    const [file, setFile] = useState<File | null>(null)
    const [pages, setPages] = useState<RenderedPage[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [scale, setScale] = useState(2)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cancelRef = useRef(false)
    const pagesRef = useRef<RenderedPage[]>([])

    const revokeAll = useCallback((list: RenderedPage[]) => {
        list.forEach(page => URL.revokeObjectURL(page.url))
    }, [])

    useEffect(() => {
        pagesRef.current = pages
    }, [pages])

    useEffect(() => {
        return () => {
            cancelRef.current = true
            revokeAll(pagesRef.current)
        }
    }, [revokeAll])

    const convertPdfToImages = useCallback(async (pdfFile: File, renderScale: number) => {
        setIsProcessing(true)
        setProgress(0)
        setError(null)
        cancelRef.current = false

        const previous = pagesRef.current
        pagesRef.current = []
        setPages([])
        revokeAll(previous)

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

        let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']> | null = null
        const newPages: RenderedPage[] = []

        try {
            const arrayBuffer = await pdfFile.arrayBuffer()
            pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            const pageCount = pdf.numPages

            for (let i = 1; i <= pageCount; i++) {
                if (cancelRef.current) break

                const page = await pdf.getPage(i)
                const viewport = page.getViewport({ scale: renderScale })

                const canvas = document.createElement('canvas')
                canvas.width = Math.ceil(viewport.width)
                canvas.height = Math.ceil(viewport.height)
                const ctx = canvas.getContext('2d')
                if (!ctx) throw new Error('Canvas not supported')

                await page.render({ canvasContext: ctx, viewport, canvas }).promise

                const blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (result) => result ? resolve(result) : reject(new Error('Failed to encode page')),
                        'image/png'
                    )
                })

                // Release the full-resolution bitmap immediately.
                canvas.width = 0
                canvas.height = 0
                page.cleanup()

                const rendered = { blob, url: URL.createObjectURL(blob) }
                newPages.push(rendered)
                pagesRef.current = [...newPages]
                setPages([...newPages])
                setProgress(Math.round((i / pageCount) * 100))
            }

            if (!cancelRef.current && newPages.length === 0) {
                setError('This PDF has no pages to render.')
            }
        } catch (err) {
            const name = (err as { name?: string })?.name
            if (name === 'PasswordException') {
                setError('This PDF is password-protected. Remove the password and try again.')
            } else {
                console.error('Error converting PDF:', err)
                setError('Could not read this PDF. Make sure it is a valid, unencrypted PDF file.')
            }
        } finally {
            if (pdf) {
                try { await pdf.destroy() } catch { /* already destroyed */ }
            }
            setIsProcessing(false)
        }
    }, [revokeAll])

    const handleFile = useCallback((selectedFile: File) => {
        if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
            setError('Please select a PDF file.')
            return
        }
        if (selectedFile.size > MAX_PDF_BYTES) {
            setError('This PDF is larger than 50 MB. Please choose a smaller file.')
            return
        }
        setError(null)
        setFile(selectedFile)
        void convertPdfToImages(selectedFile, scale)
    }, [convertPdfToImages, scale])

    const handleScale = (s: number) => {
        setScale(s)
        if (file) void convertPdfToImages(file, s)
    }

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
    }, [handleFile])

    const downloadSingle = (page: RenderedPage, index: number) => {
        const baseName = file?.name.replace(/\.pdf$/i, '') || 'document'
        saveAs(page.blob, `${baseName}-page-${index + 1}.png`)
    }

    const downloadAll = async () => {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        const baseName = file?.name.replace(/\.pdf$/i, '') || 'document'
        pages.forEach((page, i) => {
            zip.file(`${baseName}-page-${i + 1}.png`, page.blob)
        })
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `${baseName}-pages.zip`)
    }

    const handleReset = () => {
        cancelRef.current = true
        revokeAll(pagesRef.current)
        pagesRef.current = []
        setFile(null)
        setPages([])
        setError(null)
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack} aria-label="Back to all tools">←</button>
                <h1 className="tool-title">PDF to Image</h1>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}

            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                >
                    <div className="dropzone-content">
                        <div className="dropzone-icon">📑</div>
                        <p className="dropzone-text">Drop PDF here or click to browse</p>
                        <p className="dropzone-hint">Convert each PDF page to a high-quality PNG image (max 50 MB)</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
                </div>
            ) : (
                <>
                    {isProcessing ? (
                        <div className="controls-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="processing-spinner" style={{ margin: '0 auto 1.5rem' }} />
                            <h3>Converting PDF...</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)' }}>{progress}% complete</p>
                            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: '1rem' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 4, transition: 'width 0.3s' }} />
                            </div>
                            <button className="secondary-button" style={{ marginTop: '1.5rem' }} onClick={handleReset}>Cancel</button>
                        </div>
                    ) : (
                        <>
                            <div className="controls-panel">
                                <div className="control-group">
                                    <label className="control-label" id="pdf-scale-label">
                                        <span>Quality (Scale)</span>
                                        <span className="control-value">{scale}x</span>
                                    </label>
                                    <div className="select-buttons" role="group" aria-labelledby="pdf-scale-label">
                                        {[1, 1.5, 2, 3].map(s => (
                                            <button key={s} className={`select-button ${scale === s ? 'active' : ''}`} aria-pressed={scale === s} onClick={() => handleScale(s)}>{s}x</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="image-info" style={{ marginTop: '1rem' }}>
                                    <span className="info-badge"><span className="info-badge-label">File:</span><span className="info-badge-value">{file.name}</span></span>
                                    <span className="info-badge"><span className="info-badge-label">Pages:</span><span className="info-badge-value">{pages.length}</span></span>
                                </div>
                            </div>

                            <div className="results-grid" style={{ marginTop: '1.5rem' }}>
                                {pages.map((page, i) => (
                                    <div key={page.url} className="result-card">
                                        <img src={page.url} alt={`Preview of PDF page ${i + 1}`} className="result-image" />
                                        <div className="result-title">Page {i + 1}</div>
                                        <button className="secondary-button" onClick={() => downloadSingle(page, i)} style={{ width: '100%', marginTop: '0.5rem' }}>⬇️ Download</button>
                                    </div>
                                ))}
                            </div>

                            <div className="actions-bar">
                                <button className="secondary-button" onClick={handleReset}>🔄 New PDF</button>
                                <button className="download-button" onClick={downloadAll}>📦 Download All ({pages.length} images)</button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
