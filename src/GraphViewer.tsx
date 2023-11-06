import * as d3 from 'd3'
import { useEffect, useMemo, useRef } from 'react'
import { LinkDatum, NodeDatum } from './types'

export function GraphViewer({
  width,
  height,
  nodes,
  links,
}: {
  width: number
  height: number
  nodes: NodeDatum[]
  links: LinkDatum[]
}) {
  const graphRef = useRef<HTMLDivElement>(null)
  const data = useRef<{ nodes: NodeDatum[]; links: LinkDatum[] }>({ nodes: [], links: [] })
  const size = useRef({ height: 0, width: 0 })
  data.current = { nodes, links }
  size.current = { height, width }

  const graph = useMemo(() => {
    // Create base SVG.
    const svg = d3
      .create('svg')
      .attr('width', size.current.width)
      .attr('height', size.current.height)
      .attr('cursor', 'default')
      .attr('style', 'user-select: none')

    const container = svg.append('g')

    const allLinksGroup = container.append('g')
    const allNodesGroup = container.append('g')
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    // Create base selectors.
    const linkGroup = () => allLinksGroup.selectChildren<SVGGElement, LinkDatum>('g')
    const linkWeightGroup = () => linkGroup().select<SVGGElement>('g')
    const nodeGroup = () => allNodesGroup.selectChildren<SVGGElement, NodeDatum>('g')

    // Force simulation.
    const simulation = d3
      .forceSimulation(data.current.nodes)
      .force('repulsion', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(size.current.width / 2, size.current.height / 2))
      .force('collision', d3.forceCollide(30).iterations(3))
      .force(
        'link',
        d3.forceLink(data.current.links).distance((d) => d.weight * 20 + 80)
      )
      .on('tick', onTick)

    function onTick() {
      // Link the nodes.
      linkGroup()
        .select('line')
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      // Weight circle translation.
      linkWeightGroup().attr(
        'transform',
        (d) => `translate(${(d.source.x + d.target.x) / 2}, ${(d.source.y + d.target.y) / 2})`
      )

      // Nodes translation.
      nodeGroup().attr('transform', (d) => `translate(${d.x}, ${d.y})`)
    }

    // Zoom control.
    function onZoom(event: any) {
      container.attr('transform', event.transform)
    }
    const zoom = d3.zoom<SVGSVGElement, undefined>().scaleExtent([0.5, 4]).on('zoom', onZoom)
    svg.call(zoom).call(zoom.transform, d3.zoomIdentity)

    function update() {
      // Create nodes.
      const nodeGroupData = nodeGroup().data(data.current.nodes, (d) => d.nodeId)
      nodeGroupData.exit().remove()
      const nodeGroupEnter = nodeGroupData.enter().append('g')

      nodeGroupEnter
        .append('circle')
        .attr('r', 20)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .merge(nodeGroup().select('circle'))
        .transition()
        .attr('fill', (d) => color(d.colorGroup.toString()))

      nodeGroupEnter
        .append('text')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .merge(nodeGroup().select('text'))
        .text((d) => d.nodeId)

      // Handle node dragging.
      nodeGroupEnter.call(
        d3
          .drag<SVGGElement, NodeDatum>()
          .on('start', onDragStart)
          .on('drag', onDragged)
          .on('end', onDragEnd)
      )

      // Create links.
      const linkGroupData = linkGroup().data(data.current.links, (d) => d.linkId)
      linkGroupData.exit().remove()
      const linkGroupEnter = linkGroupData.enter().append('g')

      linkGroupEnter
        .merge(linkGroupData)
        .transition()
        // Fade link when status is inactive
        .attr('opacity', (d) => (d.status === 'inactive' ? '0.3' : '1'))

      // Create link line.
      linkGroupEnter
        .append('line')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .merge(linkGroup().select('line'))
        .transition()
        .attr('stroke', (d) =>
          d.source.colorGroup === d.target.colorGroup && d.status !== 'inactive'
            ? color(d.source.colorGroup.toString())
            : 'white'
        )
        // Fade link line when status is active
        .attr('opacity', (d) => (d.status === 'active' ? '0.3' : '1'))

      // Create link weight group.
      const linkWeightGroupEnter = linkGroupEnter.append('g')

      linkWeightGroupEnter
        .append('circle')
        .attr('r', 10)
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-dasharray', '2, 2')
        .merge(linkWeightGroup().select('circle'))
        .transition()
        .attr('stroke-width', (d) => (d.status === 'active' ? 2 : 0))

      linkWeightGroupEnter
        .append('text')
        .attr('font-weight', 'bold')
        .attr('font-size', '10')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .merge(linkWeightGroup().select('text'))
        .text((d) => d.weight)

      // Update force simulation.
      simulation.nodes(data.current.nodes)
      simulation.force<d3.ForceLink<NodeDatum, LinkDatum>>('link')!.links(data.current.links)
      simulation.alpha(1).restart()
    }

    function onDragStart(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function onDragged(event: any) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function onDragEnd(event: any) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    return { svg, simulation, update }
  }, [])

  useEffect(() => {
    // Mount SVG.
    graphRef.current!.append(graph.svg.node()!)

    return () => {
      graph.svg.remove()
      graph.simulation.stop()
    }
  }, [graph.simulation, graph.svg])

  useEffect(() => {
    size.current = { height, width }
    graph.svg.attr('width', width).attr('height', height)
    graph.simulation.force(
      'center',
      d3.forceCenter(size.current.width / 2, size.current.height / 2)
    )
    graph.simulation.alpha(1).restart()
  }, [graph.simulation, graph.svg, height, width])

  useEffect(() => {
    data.current = { links, nodes }
    graph.update()
  }, [graph, links, nodes])

  return (
    <div>
      <div ref={graphRef}></div>
    </div>
  )
}
