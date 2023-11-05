import { HistoryPatch, LinkDatum, NodeDatum } from './types'

export class Dsu {
  private data: number[]

  constructor(size: number) {
    this.data = [...Array(size).keys()]
  }

  public find(x: number): number {
    if (this.data[x] !== x) {
      this.data[x] = this.find(this.data[x])
    }
    return this.data[x]
  }

  public union(x: number, y: number) {
    this.data[this.find(x)] = this.find(y)
  }
}

export function kruskal(nodes: NodeDatum[], links: LinkDatum[]): HistoryPatch[] {
  const sorted = links.sort((a, b) => a.weight - b.weight)
  const history: HistoryPatch[] = []

  const saveToHistory = (nodes: NodeDatum[], links: LinkDatum[], msg: string) => {
    const nodesPatch = nodes.map((n) => ({
      nodeId: n.nodeId,
      colorGroup: n.colorGroup,
    }))
    const linksPatch = links.map((l) => ({
      linkId: l.linkId,
      status: l.status,
    }))

    history.push({
      nodes: nodesPatch,
      links: linksPatch,
      msg,
    })
  }

  for (const link of sorted) {
    link.status = 'inactive'
  }

  saveToHistory(nodes, sorted, '开始')

  const dsu = new Dsu(nodes.length)
  let mstNodeCount = 0

  for (const link of sorted) {
    link.status = 'active'
    saveToHistory(
      nodes,
      sorted,
      `选择 ${link.source.nodeId} 到 ${link.target.nodeId}，权重为 ${link.weight} 的边`
    )

    const sourceId = link.source.nodeId
    const targetId = link.target.nodeId

    if (dsu.find(sourceId) !== dsu.find(targetId)) {
      dsu.union(sourceId, targetId)

      for (const node of nodes) {
        node.colorGroup = dsu.find(node.nodeId)
      }

      link.status = 'normal'

      mstNodeCount++
      saveToHistory(nodes, sorted, `不成环，加入到最小生成树`)
    } else {
      link.status = 'inactive'
      saveToHistory(nodes, sorted, `成环，跳过这条边`)
    }

    if (mstNodeCount >= nodes.length - 1) {
      break
    }
  }

  return history
}
