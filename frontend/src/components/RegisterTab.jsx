import { useState, useRef } from 'react'
import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

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

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh (JPEG, PNG, ...)' })
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Ảnh quá lớn. Tối đa 10MB.' })
            return
        }

        setMessage(null)

        // Create preview URL
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)

        // Convert to base64
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
            // Reset form after success
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

            {/* Hidden file input */}
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
                        <div className="upload-icon">🖼️</div>
                        <span className="upload-text">Nhấn để chọn ảnh hoặc kéo thả vào đây</span>
                        <span className="upload-hint">Hỗ trợ JPEG, PNG • Tối đa 10MB</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {!previewUrl && (
                <button className="btn btn-capture" onClick={openFilePicker}>
                    <span>🖼️</span> Chọn ảnh từ máy
                </button>
            )}

            {previewUrl && (
                <div className="btn-group">
                    <button className="btn btn-secondary" onClick={removeImage}>
                        <span>🔄</span> Chọn ảnh khác
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleRegister}
                        disabled={loading}
                    >
                        {loading ? <div className="spinner" /> : <><span>✅</span> Đăng ký</>}
                    </button>
                </div>
            )}

            {/* Message */}
            {message && (
                <div className={`message ${message.type}`}>
                    <span className="icon">{message.type === 'success' ? '✅' : '❌'}</span>
                    {message.text}
                </div>
            )}
        </div>
    )
}

export default RegisterTab
