import { useEffect, useRef, useState } from 'react'
import './App.css'
import { GraphViewer } from './GraphViewer'
import { kruskal } from './algo'
import { HistoryPatch, LinkDatum, NodeDatum } from './types'
import { addNode, applyPatch, delLastNode, dumpGraph, genRandomGraphMatrix } from './utils'

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

  const [algoHistory, setAlgoHistory] = useState<HistoryPatch[]>([])
  const [historyMsg, setHistoryMsg] = useState('')
  const [nowStep, setNowStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalId = useRef<number | null>(null)

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

  useEffect(() => {
    if (nowStep < 0 || nowStep > algoHistory.length - 1) {
      return
    }
    setGraphData((data) => {
      const nodes = [...data.nodes]
      const links = [...data.links]
      applyPatch(nodes, links, algoHistory[nowStep])
      return {
        nodes,
        links,
      }
    })
    setHistoryMsg(algoHistory[nowStep].msg)
  }, [algoHistory, nowStep])

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

  function handleCompute() {
    setAlgoHistory(kruskal(graphData.nodes, graphData.links))
    setNowStep(0)
  }

  function handlePlay() {
    if (intervalId.current) {
      return
    }

    setNowStep(-1)
    setHistoryMsg('即将开始')
    setIsPlaying(true)

    intervalId.current = setInterval(() => {
      setNowStep((x) => {
        if (x >= algoHistory.length - 2) {
          clearInterval(intervalId.current!)
          intervalId.current = null
          setIsPlaying(false)
        }
        return x + 1
      })
    }, 1000)
  }

  function handleCancelPlay() {
    clearInterval(intervalId.current!)
    intervalId.current = null
    setIsPlaying(false)
  }

  function handleDelOtherLink() {
    const links = [...graphData.links]
    for (let index = links.length - 1; index >= 0; index--) {
      if (links[index].status === 'inactive') {
        links.splice(index, 1)
      }
    }
    setNowStep(-1)
    setAlgoHistory([])
    setGraphData({ nodes: graphData.nodes, links })
  }

  return (
    <div className="container">
      <div className="control-plane">
        <h1 className="bg-title">Kruskal Viewer</h1>
        <h2 className="title">克鲁斯卡尔算法可视化</h2>
        <div className="control">
          <h3>1. 图设置</h3>
          <div className="preset">
            <button disabled={isPlaying} onClick={() => handleClickPreset(0)}>
              预设 1
            </button>
            <button disabled={isPlaying} onClick={() => handleClickPreset(1)}>
              预设 2
            </button>
          </div>
          <div className="node-num">
            <button disabled={isPlaying} onClick={handleAddNode}>
              节点 ++
            </button>
            <button disabled={isPlaying} onClick={handleDelNode}>
              节点 --
            </button>
            <button disabled={isPlaying} onClick={handleRandom}>
              随机连接
            </button>
          </div>
          <h3>2. 计算</h3>
          <button onClick={handleCompute} disabled={isPlaying || graphData.links.length < 1}>
            开始计算
          </button>
          <h3>3. 可视化演示</h3>
          <div className="playback-control">
            <button onClick={handlePlay} disabled={algoHistory.length === 0}>
              从头播放
            </button>
            <button disabled={!isPlaying} onClick={handleCancelPlay}>
              取消播放
            </button>
            <button
              disabled={algoHistory.length === 0 || nowStep !== algoHistory.length - 1}
              onClick={handleDelOtherLink}
            >
              删除多余连接
            </button>
            <input
              type="range"
              min="0"
              max={algoHistory.length - 1}
              value={nowStep}
              onChange={(e) => setNowStep(Number(e.target.value))}
              className="playback-slider"
              disabled={algoHistory.length === 0}
            ></input>
          </div>
          <div className="msg">
            {algoHistory.length === 0 || historyMsg === '' ? (
              <p>无消息</p>
            ) : nowStep < 0 ? (
              <p>{historyMsg}</p>
            ) : (
              <>
                <p>
                  {nowStep + 1} / {algoHistory.length} 步：
                </p>
                <p>{historyMsg}</p>
              </>
            )}
          </div>
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
