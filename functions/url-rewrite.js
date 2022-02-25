// https://github.com/aws-samples/amazon-cloudfront-functions/tree/main/url-rewrite-single-page-apps

function handler(event) {
    var request = event.request;

    if (request.uri.endsWith('/')) {
        request.uri += 'index.html';
    } 
 
    return request;
}