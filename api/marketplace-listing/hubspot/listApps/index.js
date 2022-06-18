import { NowRequest, NowResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async (req: NowRequest, res: NowResponse) => {
    
	const url = "https://api.hubspot.com/ecosystem/public/v1/views/search?superCategory=SALES&sortField=HUB_INSTALLS&sortOrder=DESC&length=45&offset=0&language=en"
	const options = {
		method: "GET"
	}
	const response =  await fetch(url, options)
	const result = await response.json()

	return res.json({
		data:[result.items.map(function(item){
			return {
				id: item.id,
				slug: item.slug,
				name: item.name,
				short_description: item.tagline,
				icon_url: item.iconUrl,
				installs_count: item.installsCount,
				maker_name: item.companyName,
				created_at: item.firstPublishedAt,
				main_category: item.category				
			}
		})],
		meta:{
			total:result.total
		}
	});
  
};
