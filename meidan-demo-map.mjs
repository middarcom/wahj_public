// Geometry applies only to the fictional 1000×600 illustration. No geographic data.
export const boundedZoom = value => Math.max(50, Math.min(200, value));
export function zoomViewBox(value) {
    const scale = boundedZoom(value) / 100;
    const width = 1000 / scale, height = 600 / scale;
    return `${(1000-width)/2} ${(600-height)/2} ${width} ${height}`;
}
