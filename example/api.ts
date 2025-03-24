// @ts-nocheck
import wxRequest from "./request";

const { get, preRequest, all } = wxRequest;

/***
 * GET请求1
 */
export const getRankDatas = async () => {
  return await request.get<IGetTest1>({
    url: `/test1`,
    showLoading: true,
    varLabs: {
      wxdata_perf_monitor_id: "test1",
      wxdata_perf_monitor_level: 1,
    },
  });
};

/**
 * 并发请求
 */
export const getDeckStatsAndRankDetails = async () => {
  const [ans1, ans2] = await all([
    wxRequest.get<IGetTest2>(`/test2`),
    wxRequest.get<IGetTest3>(`/test3`),
  ]);

  return {
    ans1,
    ans1,
  };
};

/**
 * 预请求
 */
export const preloadDeckDetails = async (...args) => {
  preRequest({
    url: `/test4`,
    preloadKey: JSON.stringify(args),
    expireTime: 600000,
  });

  return true;
};
