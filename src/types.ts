export interface NodeDatum {
  nodeId: number
  colorGroup: number
  x: number
  y: number
}

export interface LinkDatum {
  linkId: number
  source: NodeDatum
  target: NodeDatum
  weight: number
  status: 'normal' | 'active' | 'inactive'
}

export interface HistoryPatch {
  nodes: Array<{
    nodeId: number
    colorGroup: number
  }>
  links: Array<{
    linkId: number
    status: 'normal' | 'active' | 'inactive'
  }>
  msg: string
}
