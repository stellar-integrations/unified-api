import { NowRequest, NowResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async (req: NowRequest, res: NowResponse) => {
    
  const UrlFetch = async function (url, options){ return await fetch(url, options)}
  
  const BlueprintService = function(){ 
  
    const Option = function (id, name, icon) {
        this.id = id
        this.name = name
        this.icon = icon

        this.toJSON = function () {
            return {
                id: this.id,
                name: this.name,
                icon: this.icon,
            }
        }

        return this
    }

    const inputs = []
    this.userInputs = {}
    const parentUserInputs = this.userInputs
    const Input = function (id, name, type, required) {
        this.id = id
        this.name = name
        this.type = type
        this.required = required

        const parentInput = this;

        this.getValue = function (){
            let matchingUserInput = parentUserInputs[parentInput.id]
            if(matchingUserInput){
                return matchingUserInput
            } else {
                return null
            }
        }



        this.options = []
        const parentOptions = this.options
        this.newOption = function (id, name, icon) {

            parentOptions.push(new Option(id, name, icon))
        }
        this.onListOptions = function (){ }

        this.toJSON = function () {
            return {
                id: this.id,
                name: this.name,
                type: this.type,
                required: this.required
            }
        }

        return this
    }

    const Property = function (id, name, icon) {
        this.id = id
        this.name = name
        this.icon = icon
        const parentProperty = this
        this.toJSON = function () {
            return {
                id: parentProperty.id,
                name: parentProperty.name,
                icon: parentProperty.icon
            }
        }

        return this
    }

    const results = []
    const Result = function (id, name, icon) {
        this.id = id
        this.name = name
        this.icon = icon
        this.properties = []
        const parentResult = this
        const parentProperties = this.properties
        this.newProperty = function (id, name, icon) {
            parentProperties.push(new Property(id, name, icon))
        }


        this.toJSON = function () {
            return {
                id: parentResult.id,
                name: parentResult.name,
                icon: parentResult.icon,
                properties: parentResult.properties.map(function(prop){ return prop.toJSON()})
            }
        }

        return this
    }

    this.newResult = function (id, name, icon) {
        let newResult = new Result(id, name, icon)
        results.push(newResult)

        return newResult
    }

    this.setUserInputs  = function (distantUserInputs) {

        distantUserInputs.forEach(function (dui) {
            parentUserInputs[dui.id] = dui.value
        })

    }

    this.userPreferences = {}
    this.setUserPreferences  = function (distantUserPreferences) {
        this.userPreferences = distantUserPreferences
    }

    this.userAuthentification = {}
    this.setUserAuthentification  = function (distantUserAuthentification) {
        this.userAuthentification = distantUserAuthentification
    }

    this.onListInputOptions = async function (inputId) {
        let matchingInput = inputs.filter(function (input) {
            return input.id === inputId
        })[0]
        if(matchingInput){
            await matchingInput.onListOptions()
        }
    }

    this.getInputOptionsToJSON = function (inputId){
        let matchingInput = inputs.filter(function (input) {
            return input.id === inputId
        })[0]
        if(matchingInput){
            return matchingInput.options.map(function(option) { return option.toJSON() })
        } else {
            return []
        }
    }

    this.newInput = function (id, name, type, required) {
        let newInput = new Input(id, name, type, required)
        inputs.push(newInput)
        return newInput
    }

    this.onListInputs =  function (){ }

    this.getInputsToJSON = function (){
        let jsonInputs = inputs.map(function(input) { return input.toJSON() })
        return jsonInputs
    }

    this.getResultsToJSON = function (){
        let jsonResults = results.map(function(result) { return result.toJSON() })
        return jsonResults
    }



    this.onExecusion =  function (){ }

    return this;
  };

  const Blueprint = new BlueprintService();

  function setUserInputs(userInputs){

    Blueprint.setUserInputs(userInputs)
  }

  function setUserPreferences(userPreferences){
    Blueprint.setUserPreferences(userPreferences)
  }

  function setUserAuthentification(accessToken){
    Blueprint.setUserAuthentification({ accessToken: accessToken })
  }


  // Set API base URL
  const apiURL = "https://api.notion.com/";

  // Set headers 
  // Get API token with → Blueprint.userPreferences.notion_token
  const headers = {
      "Authorization": "Bearer " + "secret_kcDG409RjmpVASEHY9gCtg9SJtEH6E6yppp7ELJDG2S", 
      "Notion-Version": "2021-08-16",
      "Content-Type": "application/json;charset=UTF-8",
  };


  // When interface request Blueprint inputs
  Blueprint.onListInputs = async function() {

      // Set database input
      let database = Blueprint.newInput("database_id", "Database", "select")

      // List available databases when interface request database input options
      database.onListOptions = async function() {

          // Use `UrlFetch` to call Notion API and get databases
          let fetchedDatabases = await UrlFetch(apiURL + "v1/search", {
              method: "post",
              headers: headers,
              body: JSON.stringify({
                  "sort": {
                      "direction": "descending",
                      "timestamp": "last_edited_time"
                  },
                  "filter": {
                      "value": "database",
                      "property": "object"
                  }
              }),
          });

          // For each available databases...
          JSON.parse(fetchedDatabases).results.map(function(db) {
              // Create a new input iption
              database.newOption(db.id, (db.title[0].plain_text ? db.title[0].plain_text : "Untitled"), null)
          })
      }

      // Set page title input
      let title = Blueprint.newInput("page_title", "Page Title", "text")

      // If the user as selected a database...
      if (database.getValue()) {

          // Get database id
          const database_id = database.getValue()

          // Fetch database properties
          const response = await UrlFetch(apiURL + "v1/databases/" + database_id, {
              method: "get",
              headers: headers
          });
          const json = JSON.parse(response)

          const properties = json.properties
          const propertyNames = Object.keys(properties).reverse()

          // For each properties...
          propertyNames.forEach(function(name) {
              const property = properties[name];

              // Filter compatible properties
              if (["number", "rich_text", "url", "email", "phone_number", "date", "checkbox", "select", "multi_select"].includes(property.type)) {

                  // Set input id with property ID and Type
                  let inputId = "property::" + property.type + "::" + property.id

                  // For property that can be set via a text input...
                  if (["number", "rich_text", "url", "email", "phone_number"].includes(property.type)) {                    
                      // Create a text input
                      const propInput = Blueprint.newInput(inputId, name, "text")

                  // For date property...
                  } else if ("date" === property.type) {
                      // Create a date input
                      const propInput = Blueprint.newInput(inputId, name, "date")

                  // For checkbox property...
                  } else if ("checkbox" === property.type) {
                      // Create a select input...
                      const propInput = Blueprint.newInput(inputId, name, "select")
                      // With two input options: true and false
                      propInput.newOption("true", "Checked", null)
                      propInput.newOption("false", "Unhecked", null)

                  // For property that can be set via a select input...
                  } else if (["select", "multi_select"].includes(property.type)){
                      // Create a select input
                      const propInput = Blueprint.newInput(inputId, name, "select")
                      // With corresponding input options...
                      property[property.type].options.map(function(option) {
                          propInput.newOption(option.id, option.name, "https://raw.githubusercontent.com/Connect-Blueprint/blueprints/main/blueprints/notion/assets/ios_select_" + option.color + ".png")
                      })                    
                  }
              }
          });
      }
  }


  Blueprint.onExecution = async function() {

    // Get user inputs
    const title = Blueprint.userInputs.page_title
    const database_id = Blueprint.userInputs.database_id

    // Set request body
    const requestBody = {
      parent: {
        database_id: database_id,
      },
      properties: {
        title: {
          title: [
              {
                text: {
                  content: title
                }
              }
          ]
        }      
      }
    }

    const inputIds = Object.keys(Blueprint.userInputs)

    // For each input ids...
    inputIds.forEach(function (inputId) {

      if(inputId === "page_title" || inputId === "database_id")
        return 

      // Get input value
      const value = Blueprint.userInputs[inputId]

      // Extract property ID and Type
      const propIdAndType = inputId.replace("property::","").split("::")
      const type = propIdAndType[0]
      const propId = propIdAndType[1]

      if (value) {
        switch (type) {
          case "number":
          requestBody.properties[propId] = {
            number: parseFloat(value),
          };
          break;
          case "rich_text":
          requestBody.properties[propId] = {
            rich_text: [
            {
              text: {
                content: value,
              },
            },
            ],
          };
          break;
          case "url":
          requestBody.properties[propId] = {
            url: value,
          };
          break;
          case "email":
          requestBody.properties[propId] = {
            email: value,
          };
          break;
          case "phone_number":
          requestBody.properties[propId] = {
            phone_number: value,
          };
          break;
          case "date":
          requestBody.properties[propId] = {
            date: {
              start: value,
            },
          };
          break;
          case "checkbox":
          requestBody.properties[propId] = {
                checkbox: value === "true" ? true : false
            };
          break;
          case "select":
          requestBody.properties[propId] = {
            select: { id: value },
          };
          break;
          case "multi_select":
          requestBody.properties[propId] = {
            multi_select: [{ id: value }]
          };
          break;
        case "relation":
          requestBody.properties[propId] = {
            relation: [{ id: value }]
          };
          break;
        }
      }
    });

    // Create page
    const response = await UrlFetch(apiURL + "v1/pages", {
      method: "post",
      headers: headers,
      body: JSON.stringify(requestBody),
    });
    const json = JSON.parse(response)

    // Create result
    Blueprint.newResult(json.id,title)  
  }

  await Blueprint.onListInputs();
  await Blueprint.onListInputOptions('database_id');

  return res.json({ message: Blueprint.getInputOptionsToJSON(inputId) });
  
};
