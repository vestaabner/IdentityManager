/*
 * Copyright 2014 Dominick Baier, Brock Allen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

using IdentityManager.Configuration.Hosting;
using System;
using System.Web.Http;
using System.Web.Http.ExceptionHandling;

namespace IdentityManager.Configuration
{
    public class WebApiConfig
    {
        public static HttpConfiguration Configure(IdentityManagerOptions options)
        {
            if (options == null) throw new ArgumentNullException("idmConfig");

            var config = new HttpConfiguration();
            config.MessageHandlers.Insert(0, new KatanaDependencyResolver());

            config.MapHttpAttributeRoutes();
            if (!options.DisableUserInterface)
            {
                config.Routes.MapHttpRoute(Constants.RouteNames.Home,
                    "",
                    new { controller = "Page", action = "Index" });
                config.Routes.MapHttpRoute(Constants.RouteNames.Logout,
                    "logout",
                    new { controller = "Page", action = "Logout" });
                //config.Routes.MapHttpRoute(Constants.RouteNames.OAuthFrameCallback,
                //    "frame",
                //    new { controller = "Page", action = "Frame" });
            }

            config.SuppressDefaultHostAuthentication();
            config.Filters.Add(new HostAuthenticationAttribute(options.SecurityConfiguration.BearerAuthenticationType));
            config.Filters.Add(new AuthorizeAttribute() { Roles = options.SecurityConfiguration.AdminRoleName });

            config.Formatters.Remove(config.Formatters.XmlFormatter);
            config.Formatters.Remove(config.Formatters.FormUrlEncodedFormatter);
            config.Formatters.JsonFormatter.SerializerSettings.ContractResolver =
                new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver();

            config.Services.Add(typeof(IExceptionLogger), new LogProviderExceptionLogger());

            return config;
        }
    }
}
