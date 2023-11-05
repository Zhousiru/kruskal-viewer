import { useEffect, useRef, useState } from 'react'
import './App.css'
import { GraphViewer } from './GraphViewer'
import { LinkDatum, NodeDatum } from './types'
import { dumpGraph, genRandomGraphMatrix } from './utils'

function App() {
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })

  const [graphData, setGraphData] = useState<{
    nodes: NodeDatum[]
    links: LinkDatum[]
  }>({ nodes: [], links: [] })

  useEffect(() => {
    const observer = new ResizeObserver((e) => {
      setGraphSize({
        width: e[0].contentRect.width,
        height: e[0].contentRect.height,
      })
    })

    observer.observe(graphContainerRef.current!)
    return () => {
      observer.disconnect()
    }
  }, [])

  function handleChange() {
    setGraphData(dumpGraph(genRandomGraphMatrix(10)))
  }

  return (
    <div className="container">
      <div className="control-plane">
        <button onClick={handleChange}>随机</button>
      </div>
      <div className="graph-container" ref={graphContainerRef}>
        <GraphViewer
          width={graphSize.width}
          height={graphSize.height}
          nodes={graphData.nodes}
          links={graphData.links}
        />
      </div>
    </div>
  )
}

export default App
