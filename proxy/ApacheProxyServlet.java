package utils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Enumeration;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.httpclient.methods.InputStreamRequestEntity;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.httpclient.methods.RequestEntity;

public class ApacheProxyServlet extends HttpServlet {
	
	private static final long serialVersionUID = 1L;
    /*
	private static String[] trusted = {
		"http://zeon/arcgis/services/sanfrancisco_wfst/mapserver/wfsserver",
		"http://zeon:8399/arcgis/services/sanfrancisco_wfst/mapserver/wfsserver"
	}; 
	*/
    public ApacheProxyServlet() {
        super();
    }

	@SuppressWarnings("unchecked")
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
		//InputStream reqInputStream = null;
		InputStream resInputStream = null;		
		OutputStream resOutputStream = null;
		
		String url = request.getParameter("url");	
		if(url == null || "".equalsIgnoreCase(url)==true) {
			url = request.getParameter("resourceUrl"); // for backward compatibility
		}
		if(url == null || "".equalsIgnoreCase(url)==true) {
			url = request.getParameter("targetUrl"); // for backward compatibility
		}
				
		Enumeration<String> enu = (Enumeration<String>)request.getParameterNames();
		while(enu.hasMoreElements()) {
			String name = (String)enu.nextElement();
			if(name.equalsIgnoreCase("url")==false 
			   && name.equalsIgnoreCase("resourceUrl")==false
			   && name.equalsIgnoreCase("targetUrl")==false) {
				// it is supposed to URL encode request.getParameter(name), but Java's URLEncoder.encode() encode " " as "+"
				//     which causes makes LAYERS parameter value not recognizable in WMS/WFS request
				//     a temporary workaround is just replacing " " with "%20" manually.
				url = url + "&" + name + "=" + request.getParameter(name).replaceAll(" ", "%20");
			}
		}
		//System.out.println(url);
		
		if(isTrusted(url) == false) {
			response.sendError(401, "accessing target server is not allowed...");
			return;
		}
				
		GetMethod get = new GetMethod(url);
		HttpClient httpclient = new HttpClient();
		try {
			httpclient.executeMethod(get);
			resInputStream = get.getResponseBodyAsStream();
			
			if(get.getResponseHeader("Content-Type") != null) {
				response.setContentType(get.getResponseHeader("Content-Type").getValue());
			} else {
				response.setContentType("text/plain");
			}							
			
			resOutputStream = response.getOutputStream();
			int buffer_length = 4096;
			byte[] buffer = new byte[buffer_length];
			int bytesRead = 0;
			while((bytesRead = resInputStream.read(buffer, 0, buffer_length)) > 0) {
				resOutputStream.write(buffer, 0, bytesRead);
			}				
		} catch(IllegalArgumentException e) {
			//
		}  catch(Exception e) {
			e.printStackTrace();
		} finally {
			get.releaseConnection();
		}
	}
	
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {		
		
		InputStream reqInputStream = null;
		InputStream resInputStream = null;		
		OutputStream resOutputStream = null;		
			
		String url = request.getParameter("url");	
		if(url == null || "".equalsIgnoreCase(url)==true) {
			url = request.getParameter("resourceUrl"); // for backward compatibility
		}
		if(url == null || "".equalsIgnoreCase(url)==true) {
			url = request.getParameter("targetUrl"); // for backward compatibility
		}
		
		if(isTrusted(url) == false) {
			response.sendError(401, "accessing target server is not allowed...");
			return;
		}
		
		PostMethod post = new PostMethod(url);			
		reqInputStream = request.getInputStream();
		RequestEntity entity = new InputStreamRequestEntity(reqInputStream, request.getContentType());
		//RequestEntity entity = new InputStreamRequestEntity(reqInputStream, "text/xml;charset=ISO-8859-1");
		post.setRequestEntity(entity);
		
		HttpClient httpclient = new HttpClient();
		try {
			httpclient.executeMethod(post);
			resInputStream = post.getResponseBodyAsStream();
			
			String contentType = post.getResponseHeader("Content-Type").getValue();						
			response.setContentType(contentType);												
			resOutputStream = response.getOutputStream();
			
			int buffer_length = 4096;
			byte[] buffer = new byte[buffer_length];
			int bytesRead = 0;
			while((bytesRead = resInputStream.read(buffer, 0, buffer_length)) > 0) {
				resOutputStream.write(buffer, 0, bytesRead);
			}				
		} catch(IllegalArgumentException e) {
			//
		} catch(Exception e) {
			e.printStackTrace();
		} finally {
			post.releaseConnection();
		}			
	}
	
	private boolean isTrusted(String url) {
		return true;
	}

}
