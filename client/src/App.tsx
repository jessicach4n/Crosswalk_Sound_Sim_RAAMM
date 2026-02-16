import './App.css'
import { io } from 'socket.io-client'

function App() {
  const socket = io("http://localhost:3001");
  
  return (
    <>
        <button onClick={() => {}}>
          Start
        </button>
    </>
  )
}

export default App
