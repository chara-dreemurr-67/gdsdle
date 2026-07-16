const FetchMeeseeksAPI = async (ServerID: string, Page: number): Promise<Response> => {
    const URL: string = `https://mee6.xyz/api/plugins/levels/leaderboard/${ServerID}?limit=1000&page=${Page}`;
    return await fetch(URL);
};

export default FetchMeeseeksAPI;