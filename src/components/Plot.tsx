import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js/lib/core';
import scatter from 'plotly.js/lib/scatter';
import bar from 'plotly.js/lib/bar';
import heatmap from 'plotly.js/lib/heatmap';
import pie from 'plotly.js/lib/pie';

Plotly.register([scatter, bar, heatmap, pie]);

const Plot = createPlotlyComponent(Plotly);
export default Plot;
