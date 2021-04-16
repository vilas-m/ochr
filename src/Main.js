import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { books } from "./data";

export default function Main() {
  let [loading, setLoader] = useState(false);
  let [text, setText] = useState("");
  let [book, setBook] = useState([
    {
      Name: "",
      Author: "",
      "Goodreads Rating": "",
      "Year Published": "",
      Genre: "",
      similarity: "",
    },
  ]);

  const recognizeText = (url) => {
    return new Promise((resolve, reject) => {
      try {
        Tesseract.recognize(url, "eng").then(({ data: { text } }) => {
          resolve(text);
        });
      } catch (e) {
        reject(e);
      }
    });
  };

  let similarity = (s1, s2) => {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (
      (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
    );
  };

  let editDistance = (s1, s2) => {
    s1 = String(s1).toLowerCase();
    s2 = String(s2).toLowerCase();

    let costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i == 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  const searchSimilarBook = (text) => {
    return new Promise((resolve, reject) => {
      resolve(
        books
          .map((i) => {
            i.similarity =
              similarity(i.Author, text) + similarity(i.Name, text);
            return i;
          })
          .filter((i) => i.similarity > 0.5)
      ).catch((e) => {
        reject(e);
      });
    });
  };

  const handleCapture = (target) => {
    if (target.files) {
      if (target.files.length !== 0) {
        setLoader(true);

        const file = target.files[0];
        const newUrl = URL.createObjectURL(file);

        recognizeText(newUrl).then((recognizedText) => {
          setText(recognizedText);
          searchSimilarBook(recognizedText).then((result) => {
            setBook(result);
          });
          setLoader(false);
        });
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loading ? (
        <>Recognizing...</>
      ) : (
        <>
          <input
            accept="image/*"
            type="file"
            onChange={(e) => {
              handleCapture(e.target);
            }}
          ></input>
          <div style={{ marginTop: 30 }}>{text}</div>
          <div style={{ marginTop: 30 }}>
            {/* {JSON.stringify(book)} */}
            {book.map((i) => {
              return (
                <div>
                  {i["Name"] && (
                    <div>
                      <b>Name:</b> {i["Name"]} <br></br>
                      <b>Author:</b> {i["Author"]} <br></br>
                      <b>Goodreads Rating:</b> {i["Goodreads Rating"]} <br></br>
                      <b>Year Published:</b> {i["Year Published"]} <br></br>
                      <b>Genre:</b> {i["Genre"]} <br></br>
                      <b>Match:</b>{" "}
                      {(Number(i["similarity"]) * 100).toFixed(2) + "%" || ""}{""}
                      <br></br>
                      <hr></hr>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
