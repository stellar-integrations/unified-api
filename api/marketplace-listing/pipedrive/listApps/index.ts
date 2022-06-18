import { NowRequest, NowResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async function (req: NowRequest, res: NowResponse) {
	
	
  	
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
    
	const base_url = "https://marketplace.pipedrive.com/api/v1/marketplace/apps/sorted"
	const url = base_url + "?sort=trending&page=0&limit=12&category=18"
	const options = {
		method: "GET"
	}
	
	const response =  await fetch(url, options)
	const result = await response.json()

	return res.json({
		data:[result.data.apps.map(function(app){
			return {
				id: app.client_id,
				slug: app.app_path,
				name: app.name,
				short_description: app.tagline,
				icon_url: app.icon.urls["256x256"],
				installs_count: null,
				maker_name: app.company_name,
				created_at: app.firstPublishedAt,
				main_category: categoryMapper(app.categories[0].id)				
			}
		})],
		meta:{
			total:result.data.totalElements
		}
	});
  
};
