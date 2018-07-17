// https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=2018%E5%B9%B41%E6%9C%88&resource_id=6018&ie=utf8&format=json

import * as request from 'request'
import * as iconv from 'iconv-lite'
import * as moment from 'moment'
import { Promise } from 'es6-promise'

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

new Promise((resolve, reject) => {
  const startyear = 2011
  const endyear = moment().year()
  let year = startyear - 1
  let result: { [startday: string]: string } = {}
  const next = () => {
    if (year++ >= endyear) {
      resolve(result)
      return
    }

    request(
      `https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=${encodeURIComponent(
        `${year}年1月`
      )}&resource_id=6018&ie=utf8&format=json`,
      { encoding: null },
      (err, res, body) => {
        if (err) {
          reject(err)
          return
        }
        let reply = JSON.parse(iconv.decode(body, 'gbk')) as ISpiderData
        if (reply.status !== '0') {
          reject(reply.status)
          return
        }
        if (reply.data[0].holidaylist) {
          reply.data[0].holidaylist.forEach(item => {
            result[item.startday] = item.name
          })
        }
        next()
      }
    )
  }
  next()
})
  .then(reply => {
    console.log(reply)
  })
  .catch(err => {
    console.error(err)
  })
