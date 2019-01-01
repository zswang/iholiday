// https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=2018%E5%B9%B41%E6%9C%88&resource_id=6018&ie=utf8&format=json

import * as request from 'request'
import * as iconv from 'iconv-lite'
import * as moment from 'moment'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { Promise } from 'es6-promise'

interface IHoliday {
  festival: string
  list: {
    date: string
    status: '1' | '2'
  }[]
  name: string
  desc: string
}
interface ISpiderData {
  status: '0' | string
  data: {
    holidaylist: {
      startday: string
      name: string
    }[]
    holiday: IHoliday[] | IHoliday
  }[]
}

new Promise((resolve, reject) => {
  const startyear = 2018
  const endyear = moment().year() + 1
  let year = startyear - 1
  let result: { [startday: string]: string } = {}
  const next = () => {
    if (year++ >= endyear) {
      resolve(result)
      return
    }

    // #region request
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
    // #endregion
  }
  next()
})
  .then(reply => {
    const startdatas = Object.keys(reply)
    let index = 0
    return new Promise((resolve, reject) => {
      const results = {}
      const next = () => {
        let startdata = startdatas[index++]
        if (!startdata) {
          resolve(results)
          return
        }
        console.log(`${index}:${startdatas.length} ${startdata}`)
        // #region request
        request(
          `https://sp0.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?query=${encodeURIComponent(
            `${moment(startdata, 'YYYY-M-D').format('YYYY年MM月DD日')}`
          )}&resource_id=6018&ie=utf8&format=json`,
          { encoding: null },
          (err, _, body) => {
            if (err) {
              reject(err)
              return
            }
            let reply = JSON.parse(iconv.decode(body, 'gbk')) as ISpiderData
            if (reply.status !== '0') {
              reject(reply.status)
              return
            }
            if (reply.data[0] && reply.data[0].holiday) {
              let holiday: IHoliday[]
              if (!(reply.data[0].holiday instanceof Array)) {
                holiday = [reply.data[0].holiday as IHoliday]
              } else {
                holiday = reply.data[0].holiday as IHoliday[]
              }
              holiday.forEach(item => {
                item.list.forEach(day => {
                  results[day.date.replace(/-(\d)\b/g, '-0$1')] = {
                    note: `${item.name}・${{ 1: '休', 2: '班' }[day.status]}`,
                    type: { 1: 'festival', 2: 'workday' }[day.status],
                  }
                })
                results[item.festival.replace(/-(\d)\b/g, '-0$1')] = {
                  note: `${item.name}`,
                  type: 'festival',
                }
              })
            }
            setTimeout(() => {
              next()
            }, 1000)
          }
        )
        // #endregion
      }
      next()
    })
  })
  .then(reply => {
    const keys = Object.keys(reply)
    const days = {}
    const years = []
    keys.sort((a, b) => {
      return a.localeCompare(b)
    })
    keys.forEach(key => {
      days[key] = reply[key]
      const y = key.slice(0, 4)
      years[y] = years[y] || {}
      years[y][key] = reply[key]
    })

    fs.writeFileSync(`./lib/days2.json`, JSON.stringify(days, null, '  '))
    Object.keys(years).forEach(key => {
      fs.writeFileSync(`./year/${key}.yaml`, yaml.safeDump(years[key]))
    })
  })
  .catch(err => {
    console.error(err)
  })
