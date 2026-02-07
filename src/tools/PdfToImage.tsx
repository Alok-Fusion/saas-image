import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import { useCallback, useRef, useState } from 'react'

interface PdfToImageProps {
    onBack: () => void
}

export default function PdfToImage({ onBack }: PdfToImageProps) {
    const [file, setFile] = useState<File | null>(null)
    const [pages, setPages] = useState<string[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [scale, setScale] = useState(2)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(async (selectedFile: File) => {
        if (selectedFile.type !== 'application/pdf') {
            alert('Please select a PDF file')
            return
        }
        setFile(selectedFile)
        await convertPdfToImages(selectedFile)
    }, [scale])

    const convertPdfToImages = async (pdfFile: File) => {
        setIsProcessing(true)
        setProgress(0)
        setPages([])

        try {
            const arrayBuffer = await pdfFile.arrayBuffer()
            const pdfDoc = await PDFDocument.load(arrayBuffer)
            const pageCount = pdfDoc.getPageCount()
            const pageImages: string[] = []

            // Create a canvas for rendering
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas not supported')

            // We'll use pdf.js for actual rendering
            const pdfjsLib = await import('pdfjs-dist')
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i)
                const viewport = page.getViewport({ scale })

                canvas.width = viewport.width
                canvas.height = viewport.height

                await page.render({ canvasContext: ctx, viewport }).promise

                const dataUrl = canvas.toDataURL('image/png')
                pageImages.push(dataUrl)
                setProgress(Math.round((i / pageCount) * 100))
            }

            setPages(pageImages)
        } catch (error) {
            console.error('Error converting PDF:', error)
            alert('Error converting PDF. Make sure it is a valid PDF file.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }, [handleFile])

    const downloadSingle = (dataUrl: string, index: number) => {
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `page_${index + 1}.png`
        link.click()
    }

    const downloadAll = async () => {
        const zip = new JSZip()
        for (let i = 0; i < pages.length; i++) {
            const data = pages[i].split(',')[1]
            zip.file(`page_${i + 1}.png`, data, { base64: true })
        }
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `${file?.name.replace('.pdf', '')}_pages.zip`)
    }

    const handleReset = () => {
        setFile(null)
        setPages([])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">PDF to Image</h1>
            </div>

            {!file ? (
                <div className={`dropzone ${isDragging ? 'dragging' : ''}`} onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <div className="dropzone-content">
                        <div className="dropzone-icon">📑</div>
                        <p className="dropzone-text">Drop PDF here or click to browse</p>
                        <p className="dropzone-hint">Convert each PDF page to a high-quality PNG image</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
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
                        </div>
                    ) : (
                        <>
                            <div className="controls-panel">
                                <div className="control-group">
                                    <label className="control-label">
                                        <span>Quality (Scale)</span>
                                        <span className="control-value">{scale}x</span>
                                    </label>
                                    <div className="select-buttons">
                                        {[1, 1.5, 2, 3].map(s => (
                                            <button key={s} className={`select-button ${scale === s ? 'active' : ''}`} onClick={() => { setScale(s); if (file) convertPdfToImages(file) }}>{s}x</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="image-info" style={{ marginTop: '1rem' }}>
                                    <span className="info-badge"><span className="info-badge-label">Pages:</span><span className="info-badge-value">{pages.length}</span></span>
                                </div>
                            </div>

                            <div className="results-grid" style={{ marginTop: '1.5rem' }}>
                                {pages.map((page, i) => (
                                    <div key={i} className="result-card">
                                        <img src={page} alt={`Page ${i + 1}`} className="result-image" />
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
