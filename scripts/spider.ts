// https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=2018%E5%B9%B41%E6%9C%88&resource_id=6018&ie=utf8&format=json

import * as request from 'request'
import * as iconv from 'iconv-lite'

interface ISpiderData {
  status: '0' | string
  data: {
    holidaylist: {
      startday: string
      name: string
    }[]
    holiday: {
      festival: string
      list: {
        date: string
        status: '1' | '2'
      }[]
      name: string
      desc: string
    }[]
  }[]
}

request(
  `https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=${encodeURIComponent(
    '2011年1月'
  )}&resource_id=6018&ie=utf8&format=json`,
  { encoding: null },
  (err, res, body) => {
    if (err) {
      console.error(err)
      return
    }
    let reply = JSON.parse(iconv.decode(body, 'gbk')) as ISpiderData
    if (reply.status !== '0') {
      return
    }
    console.log(JSON.stringify(reply.data[0].holidaylist, null, '  '))
  }
)
