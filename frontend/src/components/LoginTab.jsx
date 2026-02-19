import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: 'user',
}

function LoginTab() {
    const webcamRef = useRef(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [loggedInUser, setLoggedInUser] = useState(null)

    const startCamera = () => {
        setCameraActive(true)
        setMessage(null)
        setLoggedInUser(null)
    }

    const handleScan = useCallback(async () => {
        if (!webcamRef.current) return

        setScanning(true)
        setLoading(true)
        setMessage(null)

        // Small delay for scanning animation effect
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const imageSrc = webcamRef.current.getScreenshot()

        if (!imageSrc) {
            setMessage({ type: 'error', text: 'Không thể chụp ảnh. Vui lòng thử lại.' })
            setScanning(false)
            setLoading(false)
            return
        }

        try {
            const response = await axios.post(`${API_URL}/login`, {
                image: imageSrc,
            })

            if (response.data.success) {
                setLoggedInUser(response.data.user)
                setCameraActive(false)
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
            setMessage({ type: 'error', text: msg })
        } finally {
            setScanning(false)
            setLoading(false)
        }
    }, [webcamRef])

    const handleLogout = () => {
        setLoggedInUser(null)
        setCameraActive(false)
        setMessage(null)
    }

    // Logged in state
    if (loggedInUser) {
        return (
            <div className="welcome-screen">
                <div className="welcome-avatar">👋</div>
                <div className="welcome-title">Xin chào,</div>
                <div className="welcome-name">{loggedInUser.name}</div>
                <div className="welcome-confidence">
                    Độ chính xác: <span>{loggedInUser.confidence}%</span>
                </div>
                <button className="btn btn-secondary" onClick={handleLogout}>
                    <span>🚪</span> Đăng xuất
                </button>
            </div>
        )
    }

    return (
        <div>
            <label className="form-label">Quét khuôn mặt để đăng nhập</label>

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
                        {scanning && (
                            <div className="scanning-overlay">
                                <div className="scan-line" />
                                <span className="scanning-text">Đang quét khuôn mặt...</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="webcam-placeholder">
                        <span className="icon">🔍</span>
                        <span>Nhấn nút bên dưới để mở camera</span>
                    </div>
                )}
            </div>

            {!cameraActive ? (
                <button className="btn btn-capture" onClick={startCamera}>
                    <span>📷</span> Mở Camera
                </button>
            ) : (
                <button
                    className="btn btn-primary"
                    onClick={handleScan}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="spinner" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <span>🔐</span> Quét & Đăng nhập
                        </>
                    )}
                </button>
            )}

            {message && (
                <div className={`message ${message.type}`}>
                    <span className="icon">{message.type === 'success' ? '✅' : '❌'}</span>
                    {message.text}
                </div>
            )}
        </div>
    )
}

export default LoginTab
