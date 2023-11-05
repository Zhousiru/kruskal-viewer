import { LinkDatum, NodeDatum } from './types'

export function genRandomGraphMatrix(n: number) {
  class UnionFind {
    private parent: number[]
    private rank: number[]

    constructor(size: number) {
      this.parent = new Array(size)
      this.rank = new Array(size)
      for (let i = 0; i < size; i++) {
        this.parent[i] = i // Initially, each node is its own parent
        this.rank[i] = 0 // The tree of each node has rank 0
      }
    }

    find(x: number): number {
      if (this.parent[x] !== x) {
        this.parent[x] = this.find(this.parent[x]) // Path compression
      }
      return this.parent[x]
    }

    union(x: number, y: number): void {
      const rootX = this.find(x)
      const rootY = this.find(y)
      if (rootX === rootY) {
        return
      }
      if (this.rank[rootX] < this.rank[rootY]) {
        this.parent[rootX] = rootY
      } else if (this.rank[rootX] > this.rank[rootY]) {
        this.parent[rootY] = rootX
      } else {
        this.parent[rootY] = rootX
        this.rank[rootX]++
      }
    }
  }

  // Initialize adjacency matrix with -1
  const matrix = Array.from({ length: n }, () => Array(n).fill(-1))

  // Generate all possible edges
  const edges = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      edges.push([i, j, Math.floor(Math.random() * 10) + 1]) // Random weight between 1 and 100
    }
  }

  // Shuffle the edges
  for (let i = edges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[edges[i], edges[j]] = [edges[j], edges[i]]
  }

  // Connect all nodes randomly
  const uf = new UnionFind(n)
  for (const [u, v, w] of edges) {
    if (uf.find(u) !== uf.find(v)) {
      uf.union(u, v)
      matrix[u][v] = w
      matrix[v][u] = w // Because the graph is undirected
    }
  }

  // Add additional random edges
  const numExtraEdges = Math.floor(Math.random() * 10) + 1
  let extraEdgesAdded = 0
  while (extraEdgesAdded < numExtraEdges) {
    const u = Math.floor(Math.random() * n)
    const v = Math.floor(Math.random() * n)
    if (u !== v && matrix[u][v] === -1) {
      const weight = Math.floor(Math.random() * 10) + 1 // Random weight between 1 and 10
      matrix[u][v] = weight
      matrix[v][u] = weight // Because the graph is undirected
      extraEdgesAdded++
    }
  }

  return matrix
}

export function dumpGraph(matrix: number[][]) {
  const nodes: Array<NodeDatum> = []
  for (const index of Array.from(matrix.keys())) {
    nodes.push({
      nodeId: index,
      colorGroup: index,
      x: NaN,
      y: NaN,
    })
  }

  const links: Array<LinkDatum> = []
  let linkIndex = 0
  for (const [sourceIndex, targets] of matrix.entries()) {
    for (const [targetIndex, weight] of targets.entries()) {
      if (sourceIndex <= targetIndex) {
        continue
      }

      if (weight < 0) {
        continue
      }
      links.push({
        linkId: linkIndex++,
        source: nodes.find(({ nodeId: index }) => index === sourceIndex)!,
        target: nodes.find(({ nodeId: index }) => index === targetIndex)!,
        weight,
        status: 'normal',
      })
    }
  }

  return { nodes, links }
}

export function addNode(nodes: NodeDatum[], x: number, y: number) {
  nodes.push({
    nodeId: nodes.length,
    colorGroup: nodes.length,
    x,
    y,
  })
}

export function delLastNode(nodes: NodeDatum[], links: LinkDatum[]) {
  const delIndex = nodes.length - 1
  nodes.splice(delIndex, 1)
  for (let index = links.length - 1; index >= 0; index--) {
    const element = links[index]
    if (element.source.nodeId === delIndex || element.target.nodeId === delIndex) {
      links.splice(index, 1)
    }
  }
}
