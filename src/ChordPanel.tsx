import React, { useRef, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { ChordOptions } from 'types';
import * as d3 from 'my-d3';
// import * as d3chord from 'd3-chord';

interface Props extends PanelProps<ChordOptions> {}

export const ChordPanel: React.FC<Props> = ({ options, data, width, height }) => {
  /* The useRef Hook creates a variable that "holds on" to a value across rendering
      passes. In this case it will hold our component's SVG DOM element. It's
      initialized null and React will assign it later (see the return statement) */
  const d3Container = useRef(null);

  /* The useEffect Hook is for running side effects outside of React,
        for instance inserting elements into the DOM using D3 */
  useEffect(() => {
    if (data && d3Container.current) {
      const svg = d3.select(d3Container.current);

      // Bind D3 data
      const update = svg.append('g').attr('transform', 'translate(220,220)');

      // create input data: a square matrix that provides flow between entities
      var matrix = [
        [0, 5871, 8916, 2868],
        [1951, 0, 2060, 6171],
        [8010, 16145, 0, 8045],
        [1013, 990, 940, 0],
      ];

      // const names = ['A', 'B', 'C', 'D'];

      // 4 groups, so create a vector of 4 colors
      var colors = ['#440154ff', '#31668dff', '#37b578ff', '#fde725ff'];

      let outerRadius = Math.min(width, height) * 0.5 - 125,
        innerRadius = outerRadius - 10;

      const chord = d3
        .chordDirected()
        .padAngle(10 / innerRadius)
        .sortSubgroups(d3.descending)
        .sortChords(d3.descending);

      const arc = d3.arc<d3.ChordGroup>().innerRadius(innerRadius).outerRadius(outerRadius);

      const ribbon = d3
        .ribbonArrow<d3.Chord, d3.ChordSubgroup>()
        .radius(innerRadius - 1)
        .padAngle(1 / innerRadius);

      // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
      var res = chord(matrix);

      update
        .datum(res)
        .append('g')
        .selectAll('g')
        .data(function (d) {
          return d.groups;
        })
        .enter()
        .append('g')
        .append('path')
        .style('fill', 'grey')
        .style('stroke', 'black')
        .attr('d', arc);

      // Add a tooltip div. Here I define the general feature of the tooltip: stuff that do not depend on the data point.
      // Its opacity is set to 0: we don't see it by default.
      // const tooltip = d3
      //   .select('.tooltip-area')
      //   .append('div')
      //   .style('opacity', 0)
      //   .attr('class', 'tooltip')
      //   .style('background-color', 'white')
      //   .style('border', 'solid')
      //   .style('border-width', '1px')
      //   .style('border-radius', '5px')
      //   .style('padding', '10px');

      // A function that change this tooltip when the user hover a point.
      // Its opacity is set to 1: we can now see it. Plus it set the text and position of tooltip depending on the datapoint (d)
      // const showTooltip = function (event: any, d: d3.Chord) {
      //   tooltip
      //     .style('opacity', 1)
      //     .html('Source: ' + names[d.source.index] + '<br>Target: ' + names[d.target.index])
      //     .style('left', event.x / 2 + 300 + 'px')
      //     .style('top', event.y / 2 + 500 + 'px');
      // };

      // const hideTooltip = (event: any, d: any) => {
      //   tooltip.style('opacity', 0);
      // };

      update
        .datum(res)
        .append('g')
        .selectAll('path')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('path')
        .attr('d', ribbon)
        .style('fill', function (d) {
          return colors[d.source.index];
        })
        .style('stroke', 'black')
        .append('title')
        .text((d) => d3.version);
      // .text((d) => 'Source: ' + names[d.source.index] + '<br>Target: ' + names[d.target.index]);
      // .on('mouseover', showTooltip)
      // .on('mouseleave', hideTooltip);
    }
  });

  return <svg className="d3-component" width={660} height={660} ref={d3Container} />;
};
