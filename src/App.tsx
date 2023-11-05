import { useEffect, useRef, useState } from 'react'
import './App.css'
import { GraphViewer } from './GraphViewer'
import { LinkDatum, NodeDatum } from './types'
import { addNode, delLastNode, dumpGraph, genRandomGraphMatrix } from './utils'

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

  function handleClickPreset(id: number) {
    switch (id) {
      case 0:
        setGraphData(
          dumpGraph([
            [-1, 5, 5, 2, 5, 4],
            [5, -1, 10, 7, 7, 10],
            [5, 10, -1, 6, 5, 1],
            [2, 7, 6, -1, 1, 1],
            [5, 7, 5, 1, -1, 10],
            [4, 10, 1, 1, 10, -1],
          ])
        )
        break

      case 1:
        setGraphData(
          dumpGraph([
            [-1, 3, -1, -1, 10, -1, 10, -1, -1, 3],
            [3, -1, -1, -1, 6, -1, -1, 7, 3, -1],
            [-1, -1, -1, -1, 2, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, 6, -1, 10, 3, -1, 9],
            [10, 6, 2, 6, -1, -1, -1, -1, -1, 10],
            [-1, -1, -1, -1, -1, -1, 8, 5, 1, -1],
            [10, -1, -1, 10, -1, 8, -1, 2, 2, -1],
            [-1, 7, -1, 3, -1, 5, 2, -1, -1, -1],
            [-1, 3, -1, -1, -1, 1, 2, -1, -1, -1],
            [3, -1, -1, 9, 10, -1, -1, -1, -1, -1],
          ])
        )
        break

      default:
        break
    }
  }

  function handleAddNode() {
    const nodes = [...graphData.nodes]
    addNode(nodes, graphSize.width / 2, graphSize.height / 2)
    setGraphData({
      nodes,
      links: graphData.links,
    })
  }

  function handleDelNode() {
    const nodes = [...graphData.nodes]
    const links = [...graphData.links]
    delLastNode(nodes, links)
    setGraphData({
      nodes,
      links,
    })
  }

  function handleRandom() {
    setGraphData(dumpGraph(genRandomGraphMatrix(graphData.nodes.length)))
  }

  return (
    <div className="container">
      <div className="control-plane">
        <h1 className="bg-title">Kruskal Viewer</h1>
        <h2 className="title">克鲁斯卡尔算法可视化</h2>
        <div className="control">
          <h3>1. 图设置</h3>
          <div className="preset">
            <button onClick={() => handleClickPreset(0)}>预设 1</button>
            <button onClick={() => handleClickPreset(1)}>预设 2</button>
          </div>
          <div className="node-num">
            <button onClick={handleAddNode}>节点 ++</button>
            <button onClick={handleDelNode}>节点 --</button>
            <button onClick={handleRandom}>随机连接</button>
          </div>
          <h3>2. 计算</h3>
          <button>开始计算</button>
          <h3>3. 可视化演示</h3>
          <div className="playback-control">
            <button>播放</button>
            <button>暂停</button>
            <input
              type="range"
              min="0"
              max="40"
              defaultValue="0"
              className="playback-slider"
            ></input>
          </div>
          <div className="msg">无消息</div>
        </div>
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
