export const getPeginationParams = (query : any) => {
    const currentPage = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 10));
    const skip = (currentPage - 1) * limit;

    return { currentPage, limit, skip };
};

export const getPaginationMetadata = (
    totalCount : number,
    limit : number,
    currentPage : number,
) => {
    const totalPage = Math.ceil(totalCount / limit);
    const nextPage = currentPage < totalPage ? currentPage + 1 : null;
    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    return {
        total_count : totalCount,
        total_page : totalPage,
        next_page : nextPage,
        prev_page : prevPage,
        limit,
        current_page : currentPage,
    };
};