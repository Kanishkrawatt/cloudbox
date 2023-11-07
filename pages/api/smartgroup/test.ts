// pages/api/smartgroup/images.ts

import { NextApiRequest, NextApiResponse } from 'next';

// eslint-disable-next-line import/no-anonymous-default-export
export default (req: NextApiRequest, res: NextApiResponse) => {
  const { id, g } = req.query;

  if (id && g) {
    // Use the values of "id" and "g" here
    res.status(200).json({ id, g });
  } else {
    res.status(400).json({ message: 'Missing or invalid "id" and/or "g" parameters' });
  }
};
