import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export default function Whiteboard() {
    return (
        <div style={{ position: 'relative', height: "100vh" }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
                <Tldraw persistenceKey="example" />
            </div>
        </div>
    )
}