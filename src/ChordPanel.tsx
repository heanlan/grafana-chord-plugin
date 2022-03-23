import React from 'react';
import { PanelProps } from '@grafana/data';
import { ChordOptions } from 'types';
import ChordDiagram from 'react-chord-diagram';
import './styles.css';
// import { useTheme } from '@grafana/ui';
// import * as d3 from 'd3';

interface Props extends PanelProps<ChordOptions> {}

export const ChordPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const matrix = [
    [0, 1, 1, 1],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [1, 1, 1, 0],
  ];
  return (
    <div className="ChordPanel">
      <ChordDiagram
        width={600}
        height={600}
        matrix={matrix}
        componentId={1}
        groupLabels={['Pod1', 'Pod2', 'Pod3', 'Pod4']}
        // labelColors={['#000000', '#123456', '#AAFF11', '#FFBBFF']}
        groupColors={['#000000', '#123456', '#AAFF11', '#FFBBFF']}
        ribbonColors={['#000000']}
        persistHoverOnClick={true}
      />
    </div>
  );
};
