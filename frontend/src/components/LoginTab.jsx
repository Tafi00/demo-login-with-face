import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: 'user',
}

const SCAN_INTERVAL = 2000

// SVG Icons
const CameraIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
)

const ScanIcon = ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 7V2h5" />
        <path d="M22 7V2h-5" />
        <path d="M2 17v5h5" />
        <path d="M22 17v5h-5" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
)

const StopIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
)

const WaveIcon = ({ size = 36 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
)

const LogoutIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
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
            if (error.response?.status === 401) {
                setStatusText('Chưa nhận diện được, đang thử lại...')
            } else if (error.response?.status === 400) {
                setStatusText('Đưa khuôn mặt vào khung hình...')
            } else {
                const msg = error.response?.data?.message || ''
                setStatusText(msg || 'Đang thử lại...')
            }
        } finally {
            setScanning(false)
            setLoading(false)
        }
    }, [loading])

    useEffect(() => {
        if (cameraActive && !loggedInUser) {
            const startTimeout = setTimeout(() => {
                setStatusText('Đang tìm khuôn mặt...')
                attemptLogin()
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

    if (loggedInUser) {
        return (
            <div className="welcome-screen">
                <div className="welcome-avatar">
                    <WaveIcon size={36} />
                </div>
                <div className="welcome-title">Xin chào,</div>
                <div className="welcome-name">{loggedInUser.name}</div>
                <div className="welcome-confidence">
                    Độ chính xác: <span>{loggedInUser.confidence}%</span>
                </div>
                <button className="btn btn-secondary" onClick={handleLogout}>
                    <LogoutIcon /> Đăng xuất
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
                        <div className="scanning-overlay auto-scan">
                            <div className="scan-line" />
                            <span className="scanning-text">{statusText}</span>
                        </div>
                    </>
                ) : (
                    <div className="webcam-placeholder">
                        <span className="placeholder-icon"><ScanIcon size={48} /></span>
                        <span>Nhấn nút bên dưới để mở camera</span>
                        <span className="auto-hint">Tự động nhận diện khi phát hiện khuôn mặt</span>
                    </div>
                )}
            </div>

            {!cameraActive ? (
                <button className="btn btn-capture" onClick={startCamera}>
                    <CameraIcon /> Mở Camera
                </button>
            ) : (
                <button className="btn btn-secondary" onClick={stopCamera}>
                    <StopIcon /> Tắt Camera
                </button>
            )}

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

export default LoginTab
