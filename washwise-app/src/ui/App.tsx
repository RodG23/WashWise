import { useState } from 'react'
import './App.css'
import ListGroup from './components/ListGroup'

function App() {
  const [count, setCount] = useState(0)

  return <div><ListGroup/></div>
}

export default App
