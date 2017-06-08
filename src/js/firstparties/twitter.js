let query_params = [
  'data-expanded-url',
  'title',
];
let tcos_with_destination = query_params.map(val => {
  return "a[" + val + "][href^='https://t.co/'], a[" + val + "][href^='http://t.co/']";
}).join(", ");

let fixes = {};

function maybeAddNoreferrer(link) {
  let rel = link.rel ? link.rel : "";
  if (!rel.includes("noreferrer")) {rel += " noreferrer";}
  link.rel = rel;
}

function unwrapTco(tco, destination) {
  if (!destination) {
    return;
  }
  tco.href = destination;
  tco.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  maybeAddNoreferrer(tco);
}

function getOriginalUrl(link) {
  for (let i = 0; i < query_params.length; i++) {
    let attr = link.getAttribute(query_params[i]);
    if (attr && (attr.startsWith("https://") || attr.startsWith("http://"))) {
      return attr;
    }
  }
}

function findInAllFrames(query) {
  let out = [];
  document.querySelectorAll(query).forEach((node) => {
    out.push(node);
  });
  Array.from(document.getElementsByTagName('iframe')).forEach((iframe) => {
    try {
      iframe.contentDocument.querySelectorAll(query).forEach((node) => {
        out.push(node);
      });
    } catch(e) {
      console.log(e);
    }
  });
  return out;
}

function unwrapTwitterURLs() {
  findInAllFrames(tcos_with_destination).forEach((link) => {
    let orig_url = getOriginalUrl(link);
    if (orig_url) {
      fixes[link.href] = orig_url;
      unwrapTco(link, orig_url);
    }
  });
  findInAllFrames("a[href^='https://t.co/'], a[href^='http://t.co/'").forEach((link) => {
    if (fixes.hasOwnProperty(link.href)) {
      unwrapTco(link, fixes[link.href]);
    } else if (link.textContent.startsWith("pic.twitter.com/")) {
      unwrapTco(link, 'https://' + link.textContent);
    }
  });
}

unwrapTwitterURLs();
setInterval(unwrapTwitterURLs, 2000);
