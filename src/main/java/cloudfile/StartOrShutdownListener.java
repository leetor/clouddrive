package cloudfile;

import java.io.IOException;
import java.util.Properties;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import cloudfile.bean.User;
import cloudfile.db.DBConnection;
import cloudfile.download.DownloadTasks;
import cloudfile.utils.StrUtil;

public class StartOrShutdownListener implements ServletContextListener {
	private static final Log logger = LogFactory.getLog(User.class);

	@Override
	public void contextDestroyed(ServletContextEvent arg0) {
		DBConnection.destoryConnection();
	}

	@Override
	public void contextInitialized(ServletContextEvent arg0) {
		RSAEncrypt.getInstance();
		readConfig();
	}

	private void readConfig() {
		Properties prop = new Properties();
		try {
			prop.load(this.getClass().getResourceAsStream("/config.properties"));
		} catch (Exception e) {
			logger.error("配置文件加载异常！", e);
			System.exit(1);
		}
		String usersplit = prop.getProperty("userlist");
		if (StrUtil.isNullOrEmpty(usersplit)) {
			logger.error("配置文件配置有误，请检查");
			System.exit(1);
		}
		// 读取配置用户
		String[] usernames = usersplit.split(",");
		try {
			for (String username : usernames) {
				String password = prop.getProperty(String.format("%s_password", username));
				String directory = prop.getProperty(String.format("%s_directory", username));
				if (password == null || directory == null) {
					logger.error("配置文件配置有误，请检查");
					System.exit(1);
				}
				directory = directory.replace("\\", "/");
				User.registerUser(username, password, directory);
				// 添加用户下载目录
				DownloadTasks.putUserDownloadDir(username, directory);
			}
		} catch (IOException e) {
			logger.error("配置文件配置有误，用户目录不存在或访问权限不够，请检查", e);
			System.exit(1);
		}
		// 初始化下载任务
		DownloadTasks.initDownloadTasks();
		logger.info("初始化配置用户成功");
		// 读取数据库配置
		String dbPath = prop.getProperty("database");
		if (dbPath == null || !dbPath.endsWith(".db")) {
			logger.error("数据库配置有误，请检查");
			System.exit(1);
		}
		DBConnection.initDB(dbPath);
		logger.info("初始化数据库配置成功");
	}

}
