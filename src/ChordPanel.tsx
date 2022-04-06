import React, { useRef, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { ChordOptions } from 'types';
import * as d3 from 'my-d3';

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

      var margin = { left: 0, top: 5, right: 0, bottom: 5 };

      // Bind D3 data
      //   const update = svg.append('g').attr('transform', 'translate(220,220)');
      const diagram = svg
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + (width / 2 + margin.left) + ',' + (height / 2 + margin.top) + ')');

      // create input data: a square matrix that provides flow between entities
      const matrix = [
        [0, 5871, 8916, 2868],
        [1951, 0, 2060, 6171],
        [8010, 16145, 0, 8045],
        [1013, 990, 940, 0],
      ];

      const names = ['podA', 'podB', 'podC', 'podD'];

      // 4 groups, so create a vector of 4 colors
      var colors = ['#440154ff', '#31668dff', '#37b578ff', '#fde725ff'];

      let innerRadius = Math.min(width, height) * 0.5 - 20;
      let outerRadius = innerRadius + 6;

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

      var tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('background-color', 'white')
        .style('border', 'solid')
        .style('border-width', '2px')
        .style('border-radius', '5px')
        .style('padding', '5px');

      // add outer arcs
      diagram
        .datum(res)
        .append('g')
        .selectAll('g')
        .data(function (d) {
          return d.groups;
        })
        .enter()
        .append('g')
        .append('path')
        .style('fill', function (d) {
          return colors[d.index];
        })
        .style('stroke', 'black')
        .attr('id', function (d, i) {
          return 'group' + d.index;
        })
        .attr('d', arc);

      // add labels to arcs/groups
      diagram
        .append('g')
        .selectAll('text')
        .data(res.groups)
        .enter()
        .append('text')
        .attr('x', 6)
        .attr('dy', -5)
        .append('textPath')
        .attr('xlink:href', function (d) {
          return '#group' + d.index;
        })
        .text(function (chords, i) {
          return names[i];
        })
        .attr('style', 'black');

      // add inner ribbons
      diagram
        .datum(res)
        .append('g')
        .selectAll('path')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('path')
        .attr('d', ribbon)
        .attr('stroke', 'black')
        .style('fill', function (d) {
          return colors[d.source.index];
        })
        .on('mouseover', function (event, d) {
          return (
            tooltip
              .style('opacity', 0.9)
              // .html('Source: ' + names[d.source.index] + '<br>Target: ' + names[d.target.index])
              .html(
                `
                        <table style="margin-top: 2.5px;">
                                <tr><td>From: </td><td style="text-align: right">` +
                  names[d.source.index] +
                  `</td></tr>
                                <tr><td>To: </td><td style="text-align: right">` +
                  names[d.target.index] +
                  `</td></tr>
                                <tr><td>NP name: </td><td style="text-align: right">` +
                  names[d.source.index] +
                  `</td></tr>
                                <tr><td>Rule name: </td><td style="text-align: right">` +
                  names[d.target.index] +
                  `</td></tr>
                                <tr><td>Bytes: </td><td style="text-align: right">` +
                  d3.format('.2f')(d.source.index) +
                  `</td></tr>
                        </table>
                        `
              )
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 10 + 'px')
          );
        })
        .on('mousemove', function (event, d) {
          return tooltip.style('top', event.pageY - 10 + 'px').style('left', event.pageX + 10 + 'px');
        })
        .on('mouseout', function () {
          return tooltip.style('opacity', 0);
        });
    }
  });

  return <svg className="d3-component" width={700} height={700} ref={d3Container} />;
};
