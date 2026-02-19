import { useState, useRef } from 'react'
import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

// SVG Icons
const CameraIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
)

const RefreshIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
)

const CheckIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
)

const AlertIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
)

function RegisterTab() {
    const fileInputRef = useRef(null)
    const [name, setName] = useState('')
    const [selectedImage, setSelectedImage] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [dragActive, setDragActive] = useState(false)

    const handleFileSelect = (file) => {
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh (JPEG, PNG, ...)' })
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Ảnh quá lớn. Tối đa 10MB.' })
            return
        }

        setMessage(null)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)

        const reader = new FileReader()
        reader.onloadend = () => {
            setSelectedImage(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const handleInputChange = (e) => {
        const file = e.target.files?.[0]
        handleFileSelect(file)
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        const file = e.dataTransfer.files?.[0]
        handleFileSelect(file)
    }

    const openFilePicker = () => {
        fileInputRef.current?.click()
    }

    const removeImage = () => {
        setSelectedImage(null)
        setPreviewUrl(null)
        setMessage(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleRegister = async () => {
        if (!name.trim()) {
            setMessage({ type: 'error', text: 'Vui lòng nhập tên của bạn.' })
            return
        }
        if (!selectedImage) {
            setMessage({ type: 'error', text: 'Vui lòng chọn ảnh khuôn mặt.' })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            const response = await axios.post(`${API_URL}/register`, {
                name: name.trim(),
                image: selectedImage,
            })

            setMessage({ type: 'success', text: response.data.message })
            setTimeout(() => {
                setName('')
                setSelectedImage(null)
                setPreviewUrl(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }, 2000)
        } catch (error) {
            const msg = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
            setMessage({ type: 'error', text: msg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Name Input */}
            <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input
                    className="form-input"
                    type="text"
                    placeholder="Nhập tên của bạn..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            {/* Image Upload Section */}
            <label className="form-label">Khuôn mặt</label>

            {/* Hidden file input — accept camera on mobile too */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                style={{ display: 'none' }}
            />

            <div className="webcam-container">
                {previewUrl ? (
                    <img src={previewUrl} alt="Selected" className="captured-image" />
                ) : (
                    <div
                        className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
                        onClick={openFilePicker}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="upload-icon">
                            <CameraIcon size={48} />
                        </div>
                        <span className="upload-text">Nhấn để chọn ảnh hoặc kéo thả vào đây</span>
                        <span className="upload-hint">Hỗ trợ JPEG, PNG • Tối đa 10MB</span>
                    </div>
                )}
            </div>

            {/* Action Buttons — only show when image is selected */}
            {previewUrl && (
                <div className="btn-group">
                    <button className="btn btn-secondary" onClick={removeImage}>
                        <RefreshIcon /> Chọn ảnh khác
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleRegister}
                        disabled={loading}
                    >
                        {loading ? <div className="spinner" /> : <><CheckIcon /> Đăng ký</>}
                    </button>
                </div>
            )}

            {/* Message */}
            {message && (
                <div className={`message ${message.type}`}>
                    <span className="msg-icon">
                        {message.type === 'success' ? <CheckIcon /> : <AlertIcon />}
                    </span>
                    {message.text}
                </div>
            )}
        </div>
    )
}

export default RegisterTab
