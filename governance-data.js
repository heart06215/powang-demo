/* 公开报告的静态收录值；来源、口径与年份一并保存，不使用估算补齐缺失年份。 */
window.GovernanceData = Object.freeze({
  verifiedOn: "2026-10-30",
  legalVerifiedOn: "2026-11-10",
  projectPractice: {
  "verifiedOn": "2026-11-05",
  "basis": "作者说明",
  "developers": 1,
  "approxCost": 0,
  "modelBasis": "使用免费模型额度",
  "scope": "当前已完成样本实践",
  "note": "个人时间未折算；扩展至全量后的费用需按实际用量评估。"
},
  annotationBudget: {
  "verifiedOn": "2026-11-03",
  "commentCountVerifiedAt": "2026-11-03 09:08（北京时间）",
  "commentCountField": "data.stat.reply",
  "dayWage": 150,
  "hoursPerDay": 8,
  "secondsPerItem": 60,
  "seedCount": 107,
  "reviewRate": 0.1,
  "videos": [
    {
      "bvid": "BV1fy4y1L7Rq",
      "name": "明日方舟 PV",
      "community": "二游",
      "sampleCount": 4267,
      "onlineCount": 5588105,
      "videoUrl": "https://www.bilibili.com/video/BV1fy4y1L7Rq/",
      "countUrl": "https://api.bilibili.com/x/web-interface/view?bvid=BV1fy4y1L7Rq"
    },
    {
      "bvid": "BV1h1kcBfEuJ",
      "name": "TF 家族音乐会",
      "community": "饭圈",
      "sampleCount": 2932,
      "onlineCount": 8809111,
      "videoUrl": "https://www.bilibili.com/video/BV1h1kcBfEuJ/",
      "countUrl": "https://api.bilibili.com/x/web-interface/view?bvid=BV1h1kcBfEuJ"
    }
  ],
  "rankingReference": {
    "title": "B站评论量最多视频总排行",
    "owner": "卡猫kat",
    "dataDate": "2026-02-23",
    "url": "https://www.bilibili.com/video/BV1GAbUz2E9f/",
    "scope": "仅视频稿件，不含番剧、电影、动态、图文等",
    "note": "UP 主公开整理的榜单列这两条视频为前二，非平台官方实时排名。"
  }
},
  hardComments: [
    {
      "bvid": "BV1fy4y1L7Rq",
      "rpid": "278998110833",
      "text": "别管你那破楼了，快回来加固城墙😭",
      "difficulty": "“破楼”“加固城墙”都可能是比喻，单句没有给出所指的内容或行动。"
    },
    {
      "bvid": "BV1h1kcBfEuJ",
      "rpid": "289144371504",
      "text": "唯粉不磕别偷吃，也别舞，也别贴脸，也别看双人舞台了谢谢，看的，偷吃的，舞的，贴脸的默认橹穆99",
      "difficulty": "“磕”“偷吃”“舞”“贴脸”叠在一起，需要圈内约定才能辨别批评对象。"
    },
    {
      "bvid": "BV1fy4y1L7Rq",
      "rpid": "290585268529",
      "text": "老大 陈的真异格来了[Ave Mujica_我有话说]",
      "difficulty": "“陈”“真异格”涉及角色和游戏术语，原句没有交代指代和事件。"
    },
    {
      "bvid": "BV1h1kcBfEuJ",
      "rpid": "286637692529",
      "text": "放在几年前怎么也想不到磕的第一对rps会是sdfj的",
      "difficulty": "“磕”“rps”“sdfj”同时出现，缩写和指代都需要背景。"
    },
    {
      "bvid": "BV1fy4y1L7Rq",
      "rpid": "4993122469",
      "text": "《方舟一点也不媚宅》还记得粥版和蹦版开战的时候一些利刃说的话吗",
      "difficulty": "“粥版”“蹦版”“利刃”涉及社区、群体与旧争议，引号也会改变语气。"
    },
    {
      "bvid": "BV1h1kcBfEuJ",
      "rpid": "286748564433",
      "text": "sdfj果然是块挡门砖 给朋友们安利lm都说不想了解 结果看了一个lm故事线视频 都垂直入坑没有睡眠了。",
      "difficulty": "“sdfj”“lm”“垂直入坑”把团体、组合与态度变化压缩成圈层词汇。"
    }
  ],
  legalCases: [
    {
      "label": "民间先把材料做出来",
      "title": "毁号取证靠玩家，估值靠专业协作",
      "facts": "《三角洲行动》玩家发布维权动态后，征集同类遭遇和直播回放，整理资产清单。游戏交易平台协助寻找有资质的机构，机构逐项询价并估出3000 余元损失。游戏币没有官方人民币定价，玩家的装备清单、熟悉圈层的人提供的交易线索及专业估价，都是核查损失的材料。",
      "sources": [
        {
          "title": "当事人公开求助",
          "url": "https://www.bilibili.com/opus/1175234005740552193"
        },
        {
          "title": "新京报采访：估值过程",
          "url": "https://www.bjnews.com.cn/detail/1780013446168371.html"
        }
      ]
    },
    {
      "label": "办案难在估价",
      "title": "一个账号，两次交易差 2000 元",
      "facts": "江苏检察网披露，同一账号首次成交 4100 元，找回后转卖 2100 元。警方多方联系仍未找到有资质的估价机构。平台先行赔付 4100 元，成为评析讨论认定损失的关键材料。这类案件的数额认定取决于能否拿到可信的成交、赔付或估价材料。",
      "sources": [
        {
          "title": "江苏检察网案例评析",
          "url": "https://www.jsjc.gov.cn/qingfengyuan/202404/t20240412_190322.shtml"
        }
      ]
    }
  ],
  legalConflicts: [
    {
      "title": "游戏账号付款后没拿到",
      "marketLabel": "交易平台订单实付",
      "marketValue": 7272,
      "decisionLabel": "判令平台赔偿",
      "decision": 3636,
      "reason": "卖家冒充客服，操作确认收货并收走货款。法院认定买家保管验证码不慎，平台接到反馈后也未及时冻结交易，酌定平台承担一半损失。",
      "sources": [
        {
          "title": "广州互联网法院案例七",
          "url": "https://www.thepaper.cn/newsDetail_forward_27184365"
        }
      ]
    },
    {
      "title": "二手游戏账号被找回，赔到成交价的 6.8 倍",
      "marketLabel": "平台账号转让成交",
      "marketValue": 4800,
      "decisionLabel": "调解退还并赔偿",
      "decision": 32800,
      "reason": "买家取得账号后累计充值 57810 元。账号被找回时原号主已不是卖家，但转让协议约定卖家保证账号不被找回。调解中买家放弃部分直接损失与合理费用，卖家退还转让费 4800 元并赔偿 28000 元。充值投入计入实际损失，成交价与赔付额的差距由此产生。",
      "sources": [
        {
          "title": "澎湃新闻：包头石拐区法院首例虚拟财产案",
          "url": "https://www.thepaper.cn/newsDetail_forward_22532848"
        }
      ]
    },
    {
      "title": "短视频账号被卖家收回",
      "marketLabel": "使用权转让实付",
      "marketValue": 50000,
      "decisionLabel": "判令卖家退款",
      "decision": 30000,
      "reason": "买卖双方签约并完成账号和价款交付。法院认定买方不当使用账号构成违约，合同解除后，按实际使用、履行期限与违约影响酌定部分退款。",
      "sources": [
        {
          "title": "江苏法院网：新沂法院案例",
          "url": "https://www.jsfy.gov.cn/article/97872.html"
        }
      ]
    }
  ],
  architecture: [
    {
      "step": "01 / 数据层",
      "title": "外挂人工标注库",
      "description": "语料按视频内文本去重。作者从两个圈层抽样进行六分类人工标注，形成外置 JSON 锚定库，保存原文、类别与说明。复核更正可回写为示范。",
      "action": "查看人工示范",
      "href": "/label"
    },
    {
      "step": "02 / 推理层",
      "title": "检索注入与模型 API",
      "description": "对待标评论按字符二元组相似度检索最多 6 条人工示范，另检索最多 3 条圈层知识，合并入提示词。由 OpenAI 兼容 API 批量返回标签、置信度与理由。",
      "action": "查看分类结果",
      "href": "/#governance"
    },
    {
      "step": "03 / 微调与验证",
      "title": "导出训练集，接入微调模型",
      "description": "标注与预标注结果可导出为 JSONL 训练数据，并配置微调模型名接入同一 API。看板同步展示三档方法记录、人工标注分布和模型配置状态。",
      "action": "核对分类依据",
      "href": "/comments"
    }
  ],
  economyComparison: {
    "year": 2024,
    "chinaGdpUsd": 18729668435848,
    "comparisonGdpUsd": [
      {
        "name": "日本全年 GDP",
        "amount": 4190008188358.57
      },
      {
        "name": "韩国全年 GDP",
        "amount": 1875388209406.8
      },
      {
        "name": "俄罗斯全年 GDP",
        "amount": 2186462268813.08
      }
    ],
    "militaryExpenditureUsd": {
      "russia": 149000000000,
      "ukraine": 64700000000
    },
    "gdpUrl": "https://api.worldbank.org/v2/country/CHN;JPN;KOR;RUS/indicator/NY.GDP.MKTP.CD?format=json&date=2024",
    "militaryUrl": "https://www.sipri.org/publications/2025/sipri-fact-sheets/trends-world-military-expenditure-2024"
  },
  newsCases: [
  {
    "date": "2023-08-08",
    "kind": "国内 · 法治日报报道及法律解读",
    "title": "西安演唱会：违法占路游行与强闯安检",
    "facts": "TFBOYS 十周年演唱会前，部分粉丝在场馆周边举旗游行、喊口号；入场时有人强冲安检。警方初查场外冲突由抢占有利位置引发，并开展调查。多道安检门被冲倒，报道律师指出占路违反道路交通规定。",
    "difficulty": "口号指向、冲突起因和各群诉求，在通报里都没有现成答案。民警到场先看到的是举旗、喊话和冲闸，谁和谁有矛盾、为什么要抢位置、当事人想解决什么，都得现场追问才能拼出来。占路和冲闸可以分别核查，口号与网上组织的关系仍需原帖和时间线。",
    "source": "法治日报 / 新华网客户端转载",
    "url": "https://app.xinhuanet.com/news/article.html?articleId=40ba3643-f690-43c3-acb8-35cccf019a08"
  },
  {
    "date": "2026-08-20",
    "kind": "国内 · 警情通报相关报道",
    "title": "重庆演艺公司楼下：聚集、泼水与追逐",
    "facts": "8 月 17 日，重庆南滨路一演艺公司楼下人员聚集，个别人员发生口角、泼水与追逐。8 月 20 日，南岸警方通报继续调查。报道指周边办公与交通秩序受到影响。",
    "difficulty": "现场片段只能看到口角、泼水和追逐，看不出谁先动手、为什么聚集、参与者各自要什么。劝解和取证都要先核实身份、经过和此前沟通，圈层称呼只能当查找线索，不能直接当行为定性。",
    "source": "南方都市报 / 南方网",
    "url": "https://news.southcn.com/node_08203b6b14/31ea892806.shtml"
  },
  {
    "date": "2025-04-02",
    "kind": "国内 · 国家网信办通报",
    "title": "体育饭圈：线上攻击延伸至线下聚集",
    "facts": "国家网信办通报，部分账号辱骂运动员、教练员，挑动对立、恶意批量投诉，甚至组织扰乱公共秩序的线下聚集。整治关闭 1376 个违法违规账号，解散 5803 个违规群组。",
    "difficulty": "隐晦称呼和复读口号掩盖了攻击指向，也掩盖了组织者与参与者的诉求。核实组织关系要对照原帖、发布时间和平台留存记录，否则只能凭词语相似推定参与者。",
    "source": "国家互联网信息办公室",
    "url": "https://www.cac.gov.cn/2025-04/02/c_1745298042333612.htm"
  }
],
  officialLegalGaps: {
  "publisher": "国家互联网信息办公室",
  "document": "关于《中华人民共和国反网络暴力法（征求意见稿）》的说明",
  "publishedOn": "2026-07-29",
  "verifiedOn": "2026-11-10",
  "locator": "一、起草背景 · 第三点",
  "url": "https://www.cac.gov.cn/2026-07/29/c_1787072711938509.htm",
  "documentType": "官方起草说明",
  "draftStatus": "反网络暴力专门立法进展：征求意见稿（核对日期：2026 年 11 月 10 日）。",
  "enforcementGap": "现行刑法与部门规章可以处理部分行为。隐语指向、发布者身份和跨平台记录难以核实，线索可能因证据不足而无法进入追责程序。",
  "quotes": [
    "相关立法还比较分散",
    "基本概念、平台主体责任等还不够明确",
    "顶层设计还需完善"
  ]
},
  legislation: {
  "date": "2026-07-29",
  "verifiedOn": "2026-11-10",
  "title": "中华人民共和国反网络暴力法（征求意见稿）",
  "status": "公开征求意见文本",
  "url": "https://www.cac.gov.cn/2026-07/29/c_1787072711938509.htm",
  "note": "文件阶段：征求意见稿。"
},
  economy: [
    { year: 2020, scale: 39.2, share: 38.6, shareChange: 2.4, source: "国家网信办《数字中国发展报告（2021年）》", url: "https://www.cac.gov.cn/rootimages/uploadimg/1661066515634707/1661066515634707.pdf" },
    { year: 2021, scale: 45.5, share: 39.8, shareChange: 1.2, source: "国家网信办《数字中国发展报告（2021年）》", url: "https://www.cac.gov.cn/rootimages/uploadimg/1661066515634707/1661066515634707.pdf" },
    { year: 2022, scale: 50.2, share: 41.5, shareChange: 1.7, source: "中国信通院《数字经济发展研究报告（2023年）》", url: "https://www.caict.ac.cn/kxyj/qwfb/bps/202304/P020240326636461423455.pdf" },
    { year: 2023, scale: 53.9, share: 42.8, shareChange: 1.3, source: "北京市公共数据开放平台转引中国信通院（2024年报告）", url: "https://data.beijing.gov.cn/xydt/ljhd/6cfffe0babcd4452bda0c6422798c49b.htm" },
    { year: 2024, scale: 59.2, share: 43.8, shareChange: 1.0, nominalGrowth: 9.69, source: "中国信通院《数字经济发展研究报告（2025年）》", url: "https://www.caict.ac.cn/kxyj/qwfb/bps/202603/P020260323736507370748.pdf" }
  ],
  laws: [
    { date: "2024.08.01", title: "网络暴力信息治理规定", issuer: "国家网信办等四部门", topic: "网络暴力防范", articles: "第 12、25、26、33 条", description: "研究关联：分类标准细化、证据留存与补充材料；同时注意依法监督等排除适用情形。", url: "https://www.cac.gov.cn/2024-06/14/c_1720043894161555.htm" },
    { date: "2022.12.15", title: "互联网跟帖评论服务管理规定", issuer: "国家互联网信息办公室", topic: "评论服务责任", articles: "第 4、5 条", description: "研究关联：评论服务管理与用户权益，观察评论审核、投诉举报和复核机制。", url: "https://www.cac.gov.cn/2022-11/16/c_1670253725725039.htm" },
    { date: "2020.03.01", title: "网络信息内容生态治理规定", issuer: "国家互联网信息办公室", topic: "网络生态共治", articles: "第 9、21、24 条", description: "研究关联：平台治理、侵权表达与流量造假，形成待核查的问题清单。", url: "https://www.cac.gov.cn/2019-12/20/c_1578375159509309.htm" }
  ],
  competitions: [
    {"contest": "2026 · 第十九届中国大学生软件创新大赛", "title": "PodPal 播客派", "award": "全国一等奖", "takeaway": "借鉴：先让用户看见原有操作的困难，再用直观交互解释新的处理方式。", "url": "https://sse.bjtu.edu.cn/cms/item/1127.html"},
    { contest: "2024 · 中国大学生计算机设计大赛", title: "灵犀舆情——智能舆情预警分析可视化平台", award: "全国一等奖", takeaway: "借鉴：用社区问题组织图表，把汇总数据带回具体证据。", url: "https://www.nytdc.edu.cn/jsjgcxy/2024/0904/c961a41308/page.htm" },
    { contest: "2025 · 第十四届中国软件杯", title: "面过 Mango——多模态模拟面试系统", award: "国家一等奖", takeaway: "借鉴：从使用者的难题切入，展示分析、反馈与报告产出。", url: "https://news.whu.edu.cn/info/2111/485447.htm" },
    { contest: "2026 · 中国大学生计算机设计大赛", title: "Sumisound：跨模态AI国画艺术视听基因解码与移动创作平台", award: "国家级一等奖", takeaway: "借鉴：先讲具体需求，再呈现处理流程与可落地的使用场景。", url: "https://hainan.cuc.edu.cn/2026/0903/c8811a273534/page.htm" }
  ]
});
