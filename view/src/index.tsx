import * as React from "react";
import * as ReactDOM from "react-dom";

import "highlight.js/styles/googlecode.css";
import Highlight from "react-highlight";

import "katex/dist/katex.css";
const katex = require("katex");

const ReactMarkdown = require("react-markdown");

const convert = (text: string) => {
  // TODO: remove because of my case only
  text = text.replace(/eqnarray/g, "aligned");
  text = text.replace(/&=&/g, "&=");
  text = text.replace(/&&/g, "&");
  text = text.replace(/\\rm/g, "\\text");

  // NOTE: . does not match \n. need to use [\s\S] instead
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, x) => {
    return katex.renderToString(x.replace(/\s/g, " "), {
      displayMode: true,
      throwOnError: false
    });
  });
  text = text.replace(/\$([\s\S]*?)\$/g, (_, x) => {
    return katex.renderToString(x, {
      displayMode: false,
      throwOnError: false
    });
  });
  return text;
};

const renderMath = (text: string) => {
  return <div dangerouslySetInnerHTML={{ __html: convert(text) }} />;
};

const renderMarkdown = (text: string) => {
  return <ReactMarkdown source={text} />;
};

const renderCode = (text: string, category: string) => {
  return <Highlight className={category}>{text}</Highlight>;
};

const Root = () => {
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState("");
  const setEvent = event => {
    // webpack also sends message which is not string but object
    const data = event.data;
    try {
      const d = JSON.parse(data);
      setText(d.text);
      setCategory(d.category);
    } catch {
      // DO NOTHING
    }
  };
  React.useEffect(() => {
    window.addEventListener("message", e => setEvent(e), false);
    document.addEventListener("message", e => setEvent(e), false);
  }, []);
  if (category === "math") {
    return renderMath(text);
  } else if (category === "md") {
    return renderMarkdown(text);
  } else {
    return renderCode(text, category);
  }
};

ReactDOM.render(<Root />, document.getElementById("root"));
