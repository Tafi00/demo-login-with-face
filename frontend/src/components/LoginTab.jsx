import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: 'user',
}

// Auto-scan interval in milliseconds
const SCAN_INTERVAL = 2000

function LoginTab() {
    const webcamRef = useRef(null)
    const scanIntervalRef = useRef(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [loggedInUser, setLoggedInUser] = useState(null)
    const [statusText, setStatusText] = useState('')

    const attemptLogin = useCallback(async () => {
        if (!webcamRef.current || loading) return

        const imageSrc = webcamRef.current.getScreenshot()
        if (!imageSrc) return

        setScanning(true)
        setLoading(true)
        setStatusText('Đang nhận diện khuôn mặt...')
        setMessage(null)

        try {
            const response = await axios.post(`${API_URL}/login`, {
                image: imageSrc,
            })

            if (response.data.success) {
                // Stop scanning on success
                if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current)
                    scanIntervalRef.current = null
                }
                setLoggedInUser(response.data.user)
                setCameraActive(false)
                setScanning(false)
                setLoading(false)
                setStatusText('')
                return
            }
        } catch (error) {
            const msg = error.response?.data?.message || ''
            // Show non-intrusive status for common "not found" errors
            if (error.response?.status === 401) {
                setStatusText('Chưa nhận diện được, đang thử lại...')
            } else if (error.response?.status === 400) {
                setStatusText('Đưa khuôn mặt vào khung hình...')
            } else {
                setStatusText(msg || 'Đang thử lại...')
            }
        } finally {
            setScanning(false)
            setLoading(false)
        }
    }, [loading])

    // Start auto-scanning when camera becomes active
    useEffect(() => {
        if (cameraActive && !loggedInUser) {
            // Wait 1.5s for camera to warm up, then start scanning
            const startTimeout = setTimeout(() => {
                setStatusText('Đang tìm khuôn mặt...')
                // Run first scan immediately
                attemptLogin()
                // Then scan periodically
                scanIntervalRef.current = setInterval(() => {
                    attemptLogin()
                }, SCAN_INTERVAL)
            }, 1500)

            return () => {
                clearTimeout(startTimeout)
                if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current)
                    scanIntervalRef.current = null
                }
            }
        }
    }, [cameraActive, loggedInUser, attemptLogin])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current)
                scanIntervalRef.current = null
            }
        }
    }, [])

    const startCamera = () => {
        setCameraActive(true)
        setMessage(null)
        setLoggedInUser(null)
        setStatusText('Đang khởi động camera...')
    }

    const stopCamera = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
        setCameraActive(false)
        setScanning(false)
        setLoading(false)
        setStatusText('')
        setMessage(null)
    }

    const handleLogout = () => {
        setLoggedInUser(null)
        setCameraActive(false)
        setMessage(null)
        setStatusText('')
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
                        {/* Always show scanning overlay while camera is active */}
                        <div className="scanning-overlay auto-scan">
                            <div className="scan-line" />
                            <span className="scanning-text">{statusText}</span>
                        </div>
                    </>
                ) : (
                    <div className="webcam-placeholder">
                        <span className="icon">🔍</span>
                        <span>Nhấn nút bên dưới để mở camera</span>
                        <span className="auto-hint">Tự động nhận diện khi phát hiện khuôn mặt</span>
                    </div>
                )}
            </div>

            {!cameraActive ? (
                <button className="btn btn-capture" onClick={startCamera}>
                    <span>📷</span> Mở Camera
                </button>
            ) : (
                <button className="btn btn-secondary" onClick={stopCamera}>
                    <span>⏹️</span> Tắt Camera
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
