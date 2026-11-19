// Associate as a CloudFront Function at viewer-request on the frontend behavior.
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    if ((request.method === 'GET' || request.method === 'HEAD') &&
        uri.indexOf('/assets/') !== 0 &&
        uri.substring(uri.lastIndexOf('/') + 1).indexOf('.') === -1) {
        request.uri = '/index.html';
    }
    return request;
}
