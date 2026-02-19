import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: 'user',
}

function RegisterTab() {
    const webcamRef = useRef(null)
    const [name, setName] = useState('')
    const [capturedImage, setCapturedImage] = useState(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

    const startCamera = () => {
        setCameraActive(true)
        setCapturedImage(null)
        setMessage(null)
    }

    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot()
            setCapturedImage(imageSrc)
            setCameraActive(false)
        }
    }, [webcamRef])

    const retakePhoto = () => {
        setCapturedImage(null)
        setCameraActive(true)
        setMessage(null)
    }

    const handleRegister = async () => {
        if (!name.trim()) {
            setMessage({ type: 'error', text: 'Vui lòng nhập tên của bạn.' })
            return
        }
        if (!capturedImage) {
            setMessage({ type: 'error', text: 'Vui lòng chụp ảnh khuôn mặt.' })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            const response = await axios.post(`${API_URL}/register`, {
                name: name.trim(),
                image: capturedImage,
            })

            setMessage({ type: 'success', text: response.data.message })
            // Reset form after success
            setTimeout(() => {
                setName('')
                setCapturedImage(null)
                setCameraActive(false)
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

            {/* Camera Section */}
            <label className="form-label">Khuôn mặt</label>
            <div className="webcam-container">
                {cameraActive ? (
                    <>
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            mirrored={true}
                            style={{ width: '100%', display: 'block' }}
                        />
                        <div className="webcam-overlay">
                            <div className="face-guide" />
                        </div>
                    </>
                ) : capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="captured-image" />
                ) : (
                    <div className="webcam-placeholder">
                        <span className="icon">📸</span>
                        <span>Nhấn nút bên dưới để mở camera</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {!cameraActive && !capturedImage && (
                <button className="btn btn-capture" onClick={startCamera}>
                    <span>📷</span> Mở Camera
                </button>
            )}

            {cameraActive && (
                <button className="btn btn-capture" onClick={capturePhoto}>
                    <span>📸</span> Chụp ảnh
                </button>
            )}

            {capturedImage && (
                <div className="btn-group">
                    <button className="btn btn-secondary" onClick={retakePhoto}>
                        <span>🔄</span> Chụp lại
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
