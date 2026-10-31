import { useCallback, useEffect, useState } from 'react'
import { Columns, RotateCcw } from 'lucide-react'
import Button from '../components/Button'
import CompareView from '../components/CompareView'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import Slider from '../components/Slider'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { getImageInfo, type ImageInfo } from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface ImageComparisonSliderProps {
    onBack: () => void
    initialFile?: File | null
}

interface ComparisonImage {
    file: File
    info: ImageInfo
}

export default function ImageComparisonSlider({
    onBack,
    initialFile,
}: ImageComparisonSliderProps) {
    const [image1, setImage1] = useState<ComparisonImage | null>(null)
    const [image2, setImage2] = useState<ComparisonImage | null>(null)
    const [sliderPosition, setSliderPosition] = useState(50)
    const preview1 = useObjectUrl(image1?.file ?? null)
    const preview2 = useObjectUrl(image2?.file ?? null)
    const { error } = useToast()

    const loadImage = useCallback(
        async (selectedFile: File, slot: 1 | 2) => {
            try {
                const info = await getImageInfo(selectedFile)
                const next = { file: selectedFile, info }
                if (slot === 1) setImage1(next)
                else setImage2(next)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Could not read image')
            }
        },
        [error]
    )

    // Load initial file into slot 1 if provided
    useEffect(() => {
        if (initialFile && !image1) {
            const timer = setTimeout(() => {
                void loadImage(initialFile, 1)
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [initialFile, image1, loadImage])

    const handleReset = () => {
        setImage1(null)
        setImage2(null)
        setSliderPosition(50)
    }

    const bothImagesLoaded = Boolean(image1 && image2 && preview1 && preview2)

    const leftControls = (
        <>
            <ControlGroup label="Before Image (Left)">
                {image1 ? (
                    <FileChip
                        name={image1.file.name}
                        sizeBytes={image1.file.size}
                        width={image1.info.width}
                        height={image1.info.height}
                        thumbnailUrl={preview1 || undefined}
                        onRemove={() => setImage1(null)}
                    />
                ) : (
                    <Dropzone
                        onFiles={(files) => void loadImage(files[0], 1)}
                        title="Drop Before Image"
                        hint="Supports PNG, JPG, WebP"
                        icon="image"
                        onTrySample={async () => {
                            const s = await createSampleImage()
                            void loadImage(s, 1)
                        }}
                    />
                )}
            </ControlGroup>

            <ControlGroup label="After Image (Right)">
                {image2 ? (
                    <FileChip
                        name={image2.file.name}
                        sizeBytes={image2.file.size}
                        width={image2.info.width}
                        height={image2.info.height}
                        thumbnailUrl={preview2 || undefined}
                        onRemove={() => setImage2(null)}
                    />
                ) : (
                    <Dropzone
                        onFiles={(files) => void loadImage(files[0], 2)}
                        title="Drop After Image"
                        hint="Supports PNG, JPG, WebP"
                        icon="image"
                    />
                )}
            </ControlGroup>

            {bothImagesLoaded && (
                <ControlGroup label="Split Position" hint="Adjust manually or drag the slider line in canvas">
                    <Slider
                        value={sliderPosition}
                        min={0}
                        max={100}
                        step={1}
                        unit="%"
                        onChange={setSliderPosition}
                    />
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = bothImagesLoaded ? (
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
            <CompareView
                beforeSrc={preview1!}
                afterSrc={preview2!}
                beforeLabel="Before"
                afterLabel="After"
            />
        </div>
    ) : (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--spacing-4)',
                width: '100%',
                maxWidth: '800px',
            }}
        >
            <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                    Slot 1: Before Image
                </p>
                {image1 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-4)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)' }}>
                        <img
                            src={preview1 || undefined}
                            alt="Before preview"
                            style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: 'var(--radius-sm)' }}
                        />
                        <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                            {image1.info.width} × {image1.info.height} px
                        </p>
                    </div>
                ) : (
                    <Dropzone
                        onFiles={(files) => void loadImage(files[0], 1)}
                        title="Upload Before Image"
                        hint="PNG, JPEG, WebP"
                        icon="image"
                        onTrySample={async () => {
                            const s = await createSampleImage()
                            void loadImage(s, 1)
                        }}
                    />
                )}
            </div>

            <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                    Slot 2: After Image
                </p>
                {image2 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-4)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)' }}>
                        <img
                            src={preview2 || undefined}
                            alt="After preview"
                            style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: 'var(--radius-sm)' }}
                        />
                        <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                            {image2.info.width} × {image2.info.height} px
                        </p>
                    </div>
                ) : (
                    <Dropzone
                        onFiles={(files) => void loadImage(files[0], 2)}
                        title="Upload After Image"
                        hint="PNG, JPEG, WebP"
                        icon="image"
                    />
                )}
            </div>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                {image1 && (
                    <StatTile
                        label="Before Dim"
                        value={`${image1.info.width} × ${image1.info.height} px`}
                    />
                )}
                {image2 && (
                    <StatTile
                        label="After Dim"
                        value={`${image2.info.width} × ${image2.info.height} px`}
                    />
                )}
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset Comparison
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Comparison Slider"
                toolIcon={<Columns size={18} />}
                toolId="image-comparison"
                onBack={onBack}
                onReset={image1 || image2 ? handleReset : undefined}
            />
            <WorkspaceLayout
                leftControls={leftControls}
                centerCanvas={centerCanvas}
                bottomBar={bottomBar}
                hasFile={Boolean(image1 || image2)}
            />
        </div>
    )
}
