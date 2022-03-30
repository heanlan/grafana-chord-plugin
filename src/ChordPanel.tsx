import React, { useRef, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { ChordOptions } from 'types';
// import { useTheme } from '@grafana/ui';
import * as d3 from 'd3';
// import { ChordGroup, ChordSubgroup } from 'd3';

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
        [11975, 5871, 8916, 2868],
        [1951, 10048, 2060, 6171],
        [8010, 16145, 8090, 8045],
        [1013, 990, 940, 6907],
      ];

      // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
      var res = d3
        .chord()
        .padAngle(0.05) // padding between entities (black arc)
        .sortSubgroups(d3.descending)(matrix);

      // Enter new D3 elements
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
        .attr('d', d3.arc<d3.ChordGroup>().innerRadius(200).outerRadius(210));

      // Update existing D3 elements
      update
        .datum(res)
        .append('g')
        .selectAll('path')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('path')
        .attr('d', d3.ribbon<d3.Chord, d3.ChordGroup>().radius(200))
        .style('fill', '#69b3a2')
        .style('stroke', 'black');
    }
  });

  return <svg className="d3-component" width={600} height={600} ref={d3Container} />;
};
