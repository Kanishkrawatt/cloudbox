// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../firebase/firestore";
import {
  DocumentData,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import axios from "axios";
import { datatype } from "../../components/types";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // get post request body
  if (req.method === "POST") {
    // get body data
    // const { data } = req.body;
    const data = [
      {
        size: 583945,
        name: "image 1.png",
        type: "image/png",
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%204.png-Thu-Dec-14-2023%7D?alt=media&token=83b72a19-c83a-431e-a593-7d82111febb1",
        date: "Thu Dec 14 2023",
        location: "2",
      },
      {
        type: "image/png",
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%202.png-Thu-Dec-14-2023%7D?alt=media&token=b8fe57ab-0860-4cad-9a8b-c1d420ae0a18",
        name: "image 1.png",
        size: 583945,
        date: "Thu Dec 14 2023",
        location: "2",
      },
      {
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%201.png-Thu-Dec-14-2023%7D?alt=media&token=274ca2f7-76fe-4fcc-8d0e-a1a3ff8c2e68",
        type: "image/png",
        size: 583945,
        name: "image 1.png",
        date: "Thu Dec 14 2023",
        location: "2",
      },
      {
        name: "image 1.png",
        type: "image/png",
        size: 583945,
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%205.png-Thu-Dec-14-2023%7D?alt=media&token=3a10ce2c-d67c-4e33-a10a-c6a729f3f4c2",
        date: "Thu Dec 14 2023",
        location: "2",
      },
      {
        type: "image/png",
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%203.png-Thu-Dec-14-2023%7D?alt=media&token=bb0135ef-4871-4574-b487-67cc76a41b58",
        size: 583945,
        name: "image 1.png",
        date: "Thu Dec 14 2023",
        location: "2",
      },
    ];
    const url =
      process.env.NEXT_PUBLIC_ENV === "local"
        ? "http://localhost:8001"
        : process.env.NEXT_PUBLIC_SERVER_URL;

    const body = {
      imageUrls: data.map((item) => item.url),
    };
    // Response is coming but taking too much time
    // axios
    //   .post(`${url}`, body)
    //   .then((response) => {
    //     res.status(200).json(response.data);
    //   })
    //   .catch((error) => {
    //     res.status(500).json({ error: error.message });
    //   });
    // ---- Here Add a code when we get a response from the server modify the response using result function and add it to
    // firebase at User/${user?.uid}/Smartshare/${randomId}/smartgroup ----------------

    const mockresponse = [
      {
        urls: [
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%204.png-Thu-Dec-14-2023%7D?alt=media&token=83b72a19-c83a-431e-a593-7d82111febb1",
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%205.png-Thu-Dec-14-2023%7D?alt=media&token=3a10ce2c-d67c-4e33-a10a-c6a729f3f4c2",
        ],
      },
      {
        urls: [
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%202.png-Thu-Dec-14-2023%7D?alt=media&token=b8fe57ab-0860-4cad-9a8b-c1d420ae0a18",
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%201.png-Thu-Dec-14-2023%7D?alt=media&token=274ca2f7-76fe-4fcc-8d0e-a1a3ff8c2e68",
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%203.png-Thu-Dec-14-2023%7D?alt=media&token=bb0135ef-4871-4574-b487-67cc76a41b58",
        ],
      },
    ];
    const result = data.map((item) => {
      // Find the index of the corresponding object in mockresponse based on the URL
      const matchingUrlIndex = mockresponse.findIndex((response) =>
        response.urls.includes(item.url)
      );

      // If a matching index is found, add the 'group' property with the index value
      if (matchingUrlIndex !== -1) {
        return { ...item, group: matchingUrlIndex + 1 }; // Adding 1 to make it 1-based index
      }

      // If no matching index is found, return the item as is
      return item;
    });

    res.status(200).json(result);
  } else if (req.method === "GET") {
    //  ----- Here we will get the data from firebase and use filterData function to filter the data and send it to the client ------
    // creating a mock response
    const data = [
      {
        size: 583945,
        name: "image 1.png",
        type: "image/png",
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%204.png-Thu-Dec-14-2023%7D?alt=media&token=83b72a19-c83a-431e-a593-7d82111febb1",
        date: "Thu Dec 14 2023",
        location: "2",
      },
      {
        type: "image/png",
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%202.png-Thu-Dec-14-2023%7D?alt=media&token=b8fe57ab-0860-4cad-9a8b-c1d420ae0a18",
        name: "image 1.png",
        size: 583945,
        date: "Thu Dec 14 2023",
        location: "2",
      },
      {
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%201.png-Thu-Dec-14-2023%7D?alt=media&token=274ca2f7-76fe-4fcc-8d0e-a1a3ff8c2e68",
        type: "image/png",
        size: 583945,
        name: "image 1.png",
        date: "Thu Dec 14 2023",
        location: "2",
      },
      {
        name: "image 1.png",
        type: "image/png",
        size: 583945,
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%205.png-Thu-Dec-14-2023%7D?alt=media&token=3a10ce2c-d67c-4e33-a10a-c6a729f3f4c2",
        date: "Thu Dec 14 2023",
        location: "2",
      },
      {
        type: "image/png",
        url: "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%203.png-Thu-Dec-14-2023%7D?alt=media&token=bb0135ef-4871-4574-b487-67cc76a41b58",
        size: 583945,
        name: "image 1.png",
        date: "Thu Dec 14 2023",
        location: "2",
      },
    ];
    const mockresponse = [
      {
        urls: [
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%204.png-Thu-Dec-14-2023%7D?alt=media&token=83b72a19-c83a-431e-a593-7d82111febb1",
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%205.png-Thu-Dec-14-2023%7D?alt=media&token=3a10ce2c-d67c-4e33-a10a-c6a729f3f4c2",
        ],
      },
      {
        urls: [
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%202.png-Thu-Dec-14-2023%7D?alt=media&token=b8fe57ab-0860-4cad-9a8b-c1d420ae0a18",
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%201.png-Thu-Dec-14-2023%7D?alt=media&token=274ca2f7-76fe-4fcc-8d0e-a1a3ff8c2e68",
          "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2Fsmartgroup%2Fimage%203.png-Thu-Dec-14-2023%7D?alt=media&token=bb0135ef-4871-4574-b487-67cc76a41b58",
        ],
      },
    ];
    const result = data.map((item) => {
      // Find the index of the corresponding object in mockresponse based on the URL
      const matchingUrlIndex = mockresponse.findIndex((response) =>
        response.urls.includes(item.url)
      );

      if (matchingUrlIndex !== -1) {
        return { ...item, group: matchingUrlIndex + 1 };
      }

      return { ...item, group: 0 };
    });

    const { g } = req.query;
    if (g) {
      res.status(200).json(result.filter((item) => item.group === Number(g)));
    }
    const filteredData = result.reduce((acc, currentItem) => {
      const key = currentItem.group;
      if (!acc.has(key)) {
        acc.set(key, currentItem);
      }
      return acc;
    }, new Map());

    const GroupsData = Array.from(filteredData.values());

    return res.status(200).json(GroupsData);
  }
}
