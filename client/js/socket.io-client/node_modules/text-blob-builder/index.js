module.exports = getTextBlob;

/**
 * Builds a Blob in utf-8 from the given text if possible. Else returns null.
 */
function getTextBlob(text) {
  var blob = null;
  try {
    blob = new Blob([text], {type: 'text/html'});
  }
  catch(e) {
     var blobBuilder = window.BlobBuilder ||
                       window.WebKitBlobBuilder ||
                       window.MozBlobBuilder ||
                       window.MSBlobBuilder;
    if(blobBuilder) {
        var bb = new BlobBuilder();
        bb.append([text]);
        blob = bb.getBlob('text/html');
    }
  }
  return blob;
}
