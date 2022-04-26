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
      /* remove added 'g' elements before each draw to remove have multiple
       rendered graphs while resizing */
      d3.select('g').remove();

      var svg = d3.select(d3Container.current);

      var margin = { left: 0, top: 0, right: 0, bottom: 0 };
      var onClick = false;
      var w = width + margin.left + margin.right;
      var h = height + margin.top + margin.bottom;
      var x = width / 2 + margin.left;
      var y = height / 2 + margin.top;

      var records = [];
      type NetworkPolicy = {
        egressNP: string;
        ingressNP: string;
        egressRuleAction: number;
        ingressRuleAction: number;
        bytes: number;
        reverseBytes: number;
      };
      var npMap: Map<string, NetworkPolicy> = new Map();

      var ruleActionMap: Map<number, string> = new Map([
        [1, 'Allow'],
        [2, 'Drop'],
        [3, 'Reject'],
      ]);

      let sourcePods = data.series
        .map((series) => series.fields.find((field) => field.name === 'src'))
        .map((field) => {
          let record = field?.values as any;
          return record?.buffer;
        })[0];
      if (sourcePods !== undefined) {
        let destinationSvcs = data.series
          .map((series) => series.fields.find((field) => field.name === 'dstSvc'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let destinationPods = data.series
          .map((series) => series.fields.find((field) => field.name === 'dst'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let destinationIPs = data.series
          .map((series) => series.fields.find((field) => field.name === 'dstIP'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let bytes = data.series
          .map((series) => series.fields.find((field) => field.name === 'bytes'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let reverseBytes = data.series
          .map((series) => series.fields.find((field) => field.name === 'revBytes'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let egressNPs = data.series
          .map((series) => series.fields.find((field) => field.name === 'egressNetworkPolicyName'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let egressRuleActions = data.series
          .map((series) => series.fields.find((field) => field.name === 'egressNetworkPolicyRuleAction'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let ingressNPs = data.series
          .map((series) => series.fields.find((field) => field.name === 'ingressNetworkPolicyName'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let ingressRuleActions = data.series
          .map((series) => series.fields.find((field) => field.name === 'ingressNetworkPolicyRuleAction'))
          .map((field) => {
            let record = field?.values as any;
            return record?.buffer;
          })[0];
        let n = sourcePods.length;
        for (let i = 0; i < n; i++) {
          let record = [];
          let source = sourcePods[i];
          let destination = destinationSvcs[i];
          if (source === '') {
            source = 'N/A';
          }
          if (destination === ':0') {
            if (destinationPods[i] === '/:0') {
              if (destinationIPs === '') {
                destination = 'N/A';
              } else {
                destination = destinationIPs[i];
              }
            } else {
              destination = destinationPods[i];
            }
          }
          record.push(source);
          record.push(destination);
          record.push(bytes[i]);
          record.push(reverseBytes[i]);
          record.push(egressNPs[i]);
          record.push(egressRuleActions[i]);
          record.push(ingressNPs[i]);
          record.push(ingressRuleActions[i]);
          records.push(record);
        }
        console.log(records);
      }
      const names = Array.from(new Set(records.flatMap((d) => [d[0], d[1]])));
      var color = d3.scaleOrdinal(d3.schemeTableau10);
      const index = new Map(names.map((name: string, i) => [name, i]));
      // used to store bytes of each connection
      const matrix = Array.from(index, () => new Array(names.length).fill(0));
      for (var record of records) {
        var source: string = record[0];
        var target: string = record[1];
        var byte: number = record[2];
        var reverseByte: number = record[3];
        var egressNP: string = record[4];
        var egressRuleAction: number = record[5];
        var ingressNP: string = record[6];
        var ingressRuleAction: number = record[7];
        matrix[index.get(source)!][index.get(target)!] += byte;
        const idxStr: string = [index.get(source)!, index.get(target)!].join(','); // key
        const np: NetworkPolicy = {
          egressNP: egressNP,
          egressRuleAction: egressRuleAction,
          ingressNP: ingressNP,
          ingressRuleAction: ingressRuleAction,
          bytes: byte,
          reverseBytes: reverseByte,
        }; // value
        npMap.set(idxStr, np);
      }

      const denyColor = '#FF5733',
        allowColor = '#50C878';

      let innerRadius = Math.min(w, h) * 0.5 - 100;
      let outerRadius = innerRadius + 10;

      var diagram = svg
        .attr('width', w)
        .attr('height', h)
        .append('g')
        .attr('transform', 'translate(' + x + ',' + y + ')');

      // create a background rect as click area
      diagram
        .append('rect')
        .attr('width', w)
        .attr('height', h)
        .attr('transform', 'translate(' + -x + ',' + -y + ')')
        .style('opacity', 0)
        .on('click', function () {
          if (onClick === true) {
            ribbons.transition().style('opacity', 0.8);
            onClick = false;
          }
        });

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
      const arcs = diagram
        .datum(res)
        .append('g')
        .selectAll('g')
        .data(function (d) {
          return d.groups;
        })
        .enter()
        .append('g');

      arcs
        .append('path')
        .on('mouseover', function (event, d) {
          if (onClick === true) {
            return;
          }
          var i = d.index;
          ribbons
            .filter(function (d) {
              return d.source.index !== i && d.target.index !== i;
            })
            .transition()
            .style('opacity', 0.1);
        })
        .on('mouseout', function (event, d) {
          if (onClick === true) {
            return;
          }
          var i = d.index;
          ribbons
            .filter(function (d) {
              return d.source.index !== i && d.target.index !== i;
            })
            .transition()
            .style('opacity', 0.8);
        })
        .on('click', function (event, d) {
          event.stopPropagation();
          onClick = true;
          var i = d.index;
          ribbons
            .filter(function (d) {
              return d.source.index !== i && d.target.index !== i;
            })
            .transition()
            .style('opacity', 0.1);
        })
        .style('fill', function (d) {
          return color(names[d.index]);
        })
        .style('stroke', 'black')
        .attr('id', function (d, i) {
          return 'group' + d.index;
        })
        .attr('d', arc);

      // add labels to arcs
      diagram
        .append('g')
        .selectAll('text')
        .data(res.groups)
        .enter()
        .append('text')
        .each(function (d: any) {
          d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr('dy', '.35em')
        .attr('class', 'titles')
        .attr('text-anchor', function (d: any) {
          return d.angle > Math.PI ? 'end' : null;
        })
        .attr('transform', function (d: any) {
          return (
            'rotate(' +
            ((d.angle * 180) / Math.PI - 90) +
            ')' +
            'translate(' +
            (innerRadius + 15) +
            ')' +
            (d.angle > Math.PI ? 'rotate(180)' : '')
          );
        })
        .attr('opacity', 0.9)
        .append('tspan')
        .attr('x', 0)
        .attr('dy', 0)
        .text(function (chords, i) {
          var s = names[i].split('/').join(',').split(':').join(',').split(',');
          if (s[0] !== undefined) {
            return s[0];
          } else {
            return '';
          }
        })
        .append('tspan')
        .attr('x', 0)
        .attr('dy', 15)
        .text(function (chords, i) {
          var s = names[i].split('/').join(',').split(':').join(',').split(',');
          if (s[1] !== undefined) {
            return s[1];
          } else {
            return '';
          }
        })
        .attr('style', 'black');

      // add inner ribbons
      var ribbons = diagram
        .datum(res)
        .append('g')
        .selectAll('path')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('path');

      ribbons
        .attr('d', ribbon)
        .attr('stroke', 'black')
        .style('opacity', 0.8)
        // customize ribbon color, deny -> red, allow -> green, others -> source group color
        .style('fill', function (d) {
          const idxStr = [d.source.index, d.target.index].join(',');
          const egressRuleAction = npMap.get(idxStr)?.egressRuleAction;
          const ingressRuleAction = npMap.get(idxStr)?.ingressRuleAction;
          if (egressRuleAction === 2 || egressRuleAction === 3 || ingressRuleAction === 2 || ingressRuleAction === 3) {
            return denyColor;
          }
          if (egressRuleAction === 1 || ingressRuleAction === 1) {
            return allowColor;
          }
          return color(names[d.source.index]);
        })
        .on('mouseover', function (event, d) {
          const idxStr = [d.source.index, d.target.index].join(',');
          const np = npMap.get(idxStr)!;
          var texts =
            `
          <table style="margin-top: 2.5px;">
          <tr><td>From: </td><td style="text-align: right">` +
            names[d.source.index] +
            `</td></tr><tr><td>To: </td><td style="text-align: right">` +
            names[d.target.index];
          if (np.egressNP !== '') {
            texts +=
              `</td></tr>
            <tr><td>Egress NetworkPolicy name: </td><td style="text-align: right">` +
              np.egressNP +
              `</td></tr>
            <tr><td>Egress NetworkPolicy Rule Action: </td><td style="text-align: right">` +
              ruleActionMap.get(np.egressRuleAction);
          }
          if (np.ingressNP !== '') {
            texts +=
              `</td></tr>
            <tr><td>Ingress NetworkPolicy name: </td><td style="text-align: right">` +
              np.ingressNP +
              `</td></tr>
            <tr><td>Ingress NetworkPolicy Rule Action: </td><td style="text-align: right">` +
              ruleActionMap.get(np.ingressRuleAction);
          }
          texts +=
            `</td></tr>
          <tr><td>Bytes: </td><td style="text-align: right">` +
            np.bytes +
            `</td></tr>
          <tr><td>Reverse Bytes: </td><td style="text-align: right">` +
            np.reverseBytes +
            `</td></tr>
                  </table>
                  `;
          return tooltip
            .style('opacity', 0.9)
            .html(texts)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px');
        })
        .on('mousemove', function (event, d) {
          return tooltip.style('top', event.pageY - 10 + 'px').style('left', event.pageX + 10 + 'px');
        })
        .on('mouseout', function () {
          return tooltip.style('opacity', 0);
        });
    }
  });

  return <svg className="d3-component" width={width} height={height} ref={d3Container} />;
};
