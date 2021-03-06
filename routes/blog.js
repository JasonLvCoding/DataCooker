const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db/index');
const Mock = require('mockjs');
const Random = Mock.Random
const asyncBusboy = require('async-busboy');
//创建一篇博客，必须登录
router.post('/api/blog', async (ctx, next) => {
  let data = Utils.filter(ctx.request.body, ['title', 'content', 'tag_id', 'note_id', 'brief', 'publish', 'create_time']),
    { uid } = ctx.state || {};
  let res = Utils.formatData(data, [
    { key: 'note_id', type: 'number' },
    { key: 'title', type: 'string' },
    { key: 'brief', type: 'string' },
    { key: 'content', type: 'string' },
    { key: 'publish', type: 'number' }
  ]);
  if (!res) return ctx.body = Tips[1007];
  let { title = '无标题', content = '', note_id = '', brief = '', publish = 0, create_time = '' } = data;
  create_time = Utils.formatCurrentTime(create_time);
  let sql = `INSERT INTO t_blog(title,content,note_id,create_time,uid,brief,publish) VALUES (?,?,?,?,?,?,?)`,
    value = [title, content, note_id, create_time, uid, brief, publish];
  await db.query(sql, value).then(async res => {
    let { insertId: id } = res;
    ctx.body = {
      ...Tips[0],
      data: { id }
    }

  }).catch(e => {
    ctx.body = Tips[1002];
  });

});

//修改博客
router.post('/api/blog/:id', async (ctx, next) => {
  let data = Utils.filter(ctx.request.body, ['title', 'origin_tag_id', 'content', 'tag_id', 'note_id', 'id', 'brief', 'publish', 'create_time']),
    { uid } = ctx.state || {};
  let res = Utils.formatData(data, [
    { key: 'note_id', type: 'number' },
    { key: 'id', type: 'number' },
    { key: 'title', type: 'string' },
    { key: 'brief', type: 'string' },
    { key: 'content', type: 'string' },
    { key: 'publish', type: 'number' }
  ]);
  if (!res) return ctx.body = Tips[1007];
  let { title, content, note_id, id, brief, publish = 0, create_time = '' } = data;
  create_time = Utils.formatCurrentTime(create_time);
  let sql = `UPDATE t_blog set title=?,content=?,note_id=?,brief=?,publish=?,create_time=? WHERE uid=? AND id=?;`,
    value = [title, content, note_id, brief, publish, create_time, uid, id];

  await db.query(sql, value).then(async res => {
    ctx.body = Tips[0];
  }).catch(e => {
    ctx.body = Tips[1002];
  })

});

//删除博客
router.delete('/api/blog/:id', async (ctx, next) => {
  let data = Utils.filter(ctx.request.body, ['id']), { uid } = ctx.state || {};
  let res = Utils.formatData(data, [
    { key: 'id', type: 'number' }
  ]);
  if (!res) return ctx.body = Tips[1007];
  let { id } = data;
  let sql = 'UPDATE t_blog set is_delete=1 WHERE id=? AND uid=?', value = [id, uid];
  await db.query(sql, value).then(async res => {
    ctx.body = Tips[0];
  }).catch(e => {
    ctx.body = Tips[1002];
  });
});

//分页查询我所有的博客 type:0：我所有的 1 根据笔记本查询
router.get('/api/blogs', async (ctx, next) => {

  await new Promise((resolve, reject) => {
    let data = Mock.mock({
      // 属性 list 的值是一个数组，其中含有 1 到 10 个元素
      'list|1-10': [{
        // 属性 id 是一个自增数，起始值为 1，每次增 1
        'id|+1': 1,
        'name': Random.cname(),
        'imgUrl': Random.image('250x250','#f56a58','#282828',Random.name()),
        'title': Random.cname(),
        'subtitle': Random.name(),
        'description': Random.cparagraph(3)
      }]
    })

    setTimeout(() => {
      ctx.body = {
        code: 200,
        messsage: 'success',
        entity: {
          content: data.list,
          page: 0,
          pageSize: 10,
          total: 100
        }
      };
      resolve()
    }, 1000)
  })

});
//查看博客详情
router.get('/api/blog/:id', async (ctx, next) => {
  let data = ctx.params;
  let res = Utils.formatData(data, [
    { key: 'id', type: 'number' }
  ]);
  if (!res) return ctx.body = Tips[1007];
  let { id } = data;
  id = parseInt(id);
  let sql = `SELECT content,id,title,note_id,brief,create_time,publish  FROM t_blog WHERE id=${id} AND is_delete=0;`;
  await db.query(sql).then(res => {
    let detail = res[0] || [];
    if (detail.length > 0) {
      ctx.body = { ...Tips[0], data: detail }

    } else {
      ctx.body = Tips[1003]
    }
  }).catch(e => {
    ctx.body = Tips[1002];
  })
});

module.exports = router;