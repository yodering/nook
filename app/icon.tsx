import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = { width: 256, height: 256 }
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#FCFAF6',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 64, // 25% rounding
                    border: '4px solid rgba(160, 140, 120, 0.1)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', transform: 'translate(4px, -12px)' }}>
                    <span style={{
                        fontSize: 160,
                        fontFamily: 'serif',
                        color: '#2D2520',
                        lineHeight: 1,
                        fontWeight: 500,
                    }}>n</span>
                    <svg width="60" height="60" viewBox="0 0 24 24" style={{ color: '#7F9F95', marginLeft: '2px', marginTop: '20px' }}>
                        <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    </svg>
                </div>
            </div>
        ),
        { ...size }
    )
}
