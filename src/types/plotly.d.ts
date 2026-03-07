/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'react-plotly.js/factory' {
  const createPlotlyComponent: (plotly: any) => any;
  export default createPlotlyComponent;
}
declare module 'plotly.js/lib/core' {
  const Plotly: any;
  export default Plotly;
}
declare module 'plotly.js/lib/scatter' { const m: any; export default m; }
declare module 'plotly.js/lib/bar' { const m: any; export default m; }
declare module 'plotly.js/lib/heatmap' { const m: any; export default m; }
declare module 'plotly.js/lib/pie' { const m: any; export default m; }

declare namespace Plotly {
  type Data = any;
}
