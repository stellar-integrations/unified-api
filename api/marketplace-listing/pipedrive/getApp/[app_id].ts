import { NowRequest, NowResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async function (req: NowRequest, res: NowResponse) {
	
	 const { app_id } = req.query;
  	
	const categories = [
	      {
		"source":11,
		"unified":"PHONE"
	      },
	      {
		"source":18,
		"unified":"WEBINAR"
	      },
	      {
		"source":12,
		"unified":"QUOTES"
	      }  
	    ]
	
	function categoryMapper(source_id){
		const category = categories.filter(function (cat){ return cat.source == source_id })
		if(category && category[0] && category[0].unified){
			return category[0].unified
		}else{
			return "UNKNOWN"
		}
	}
    
	const base_url = "https://marketplace.pipedrive.com/api/v1/marketplace/apps/" + app_id
	const url = base_url
	const options = {
		method: "GET"
	}
	
	const response =  await fetch(url, options)
	const result = await response.json()

	return res.json({
    name: result.data.app.name,
    description: result.data.app.description,
    short_description: result.data.app.tagline,
    icon_url: result.data.app.icon.urls["256x256"],
    thumbnail_urls:result.data.app.icon.screenshots.map(function(screenshot){ return screenshot.urls["1280x800"] })
    main_category: categoryMapper(result.data.app.category_ids[0]),
    maker_name: result.data.app.company_name,
    rating_avg: result.data.app.ratings.scores.average,
    rating_count: result.data.app.ratings.scores.total,
    review_count: result.data.app.ratings.reviews,
    intall_count: null

});
  
};
