import os
import cv2
import glob
import numpy as np
import math

# def centroid_histogram(labels):
#     # grab the number of different clusters and create a histogram
#     # based on the number of pixels assigned to each cluster
#     numLabels = np.arange(0, len(np.unique(labels)) + 1)
#     (hist, _) = np.histogram(labels, bins = numLabels)
 
#     # normalize the histogram, such that it sums to one
#     hist = hist.astype("float")
#     hist /= hist.sum()
 
#     # return the histogram
#     return hist

# def plot_colors(hist, centroids):
#     # initialize the bar chart representing the relative frequency
#     # of each of the colors
#     bar = np.ones((50, 300, 3), dtype = "uint8")*255
#     startX = 0

#     # print 'before'
#     # print hist, centroids

#     elem_index = np.where((centroids[:,0]<10)&(centroids[:,1]<10)&(centroids[:,2]<10))
#     hist = np.delete(hist, [elem_index], 0)
#     centroids = np.delete(centroids, elem_index, 0)
#     hist /= hist.sum()

#     # print 'after'
#     # print hist, centroids
 
#     # loop over the percentage of each cluster and the color of
#     # each cluster
#     for (percent, color) in zip(hist, centroids):
#         # print color, percent
#         # plot the relative percentage of each cluster
#         endX = startX + (percent * 300)
#         cv2.rectangle(bar, (int(startX), 0), (int(endX), 50),
#             color.astype("uint8").tolist(), -1)
#         startX = endX
    
#     # return the bar chart
#     return bar

def getTotalFrames(isMovie, cap, images):
    if isMovie:
        return int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    else:
        return len(images)

def getNextFrame(isMovie, cap, images, cursor, total):
    if isMovie:
        return cap.read()
    else:
        if( cursor < total):
            frame = cv2.imread(images[cursor])
            cursor += 1
            return (True,frame)
        else:
            return (False,None)

DIR = os.path.dirname(os.path.realpath(__file__))
print DIR

SEQ_SZ = 100

KERNEL_SZ = 3
SIGMA_COLOR = 50
SIGMA_SPACE = 50
K = 5
alpha = 0.75

FILENAME = DIR + "/tests/59b064f62f8bff77f5c53627/movie.mp4" #DIR + "/tests/58d3fef2794f781a395884f7/*.jpg"
ROOT_DIR = os.path.dirname(os.path.realpath(FILENAME))
isMovie = FILENAME.endswith(".mp4")

cap = None
images = None

if isMovie:
    cap = cv2.VideoCapture(FILENAME)
else:
    images =  glob.glob(FILENAME)
    # print images
    images.sort()
    
cursor = 0
totalImages  = getTotalFrames(isMovie, cap, images)
print totalImages, 'images'
totalImages = SEQ_SZ

 # params for ShiTomasi corner detection
# feature_params = dict( maxCorners = 100,
#                        qualityLevel = 0.3,
#                        minDistance = 7,
#                        blockSize = 7 )
# Parameters for lucas kanade optical flow
# lk_params = dict( winSize  = (15,15),
#                   maxLevel = 2,
#                   criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))
# Create some random colors
# color = np.random.randint(0,255,(100,3))

ok, frame1 = getNextFrame(isMovie, cap, images, cursor, totalImages)
blur = cv2.bilateralFilter(frame1,KERNEL_SZ,SIGMA_COLOR,SIGMA_SPACE)
prev = cv2.cvtColor(blur,cv2.COLOR_BGR2GRAY)

hsv = np.zeros_like(blur)
hsv[...,1] = 255

# Take first frame and find corners in it
# p0 = cv2.goodFeaturesToTrack(prev, mask = None, **feature_params)
# Create a mask image for drawing purposes
# mask = np.zeros_like(frame1)

while cursor < totalImages:
    cursor += 1

    ok, frame2 = getNextFrame(isMovie, cap, images, cursor, totalImages)
    blur = cv2.bilateralFilter(frame2,KERNEL_SZ,SIGMA_COLOR,SIGMA_SPACE)
    next = cv2.cvtColor(blur,cv2.COLOR_BGR2GRAY)

    flow = cv2.calcOpticalFlowFarneback(prev,next, None, 0.5, 3, 15, 3, 5, 1.5, 0)

    mag, ang = cv2.cartToPolar(flow[...,0], flow[...,1])
    mag = cv2.normalize(mag,None,0,255,cv2.NORM_MINMAX)
    new_ang = ang*180/np.pi/2
    # values = [0, 90, 180, 270, 360]
    # bins = np.array([0,
    #                 1*np.pi/4,   # RIGHT 
    #                 3*np.pi/4, # UP 
    #                 5*np.pi/4, # LEFT
    #                 7*np.pi/4, # DOWN
    #                 8*np.pi/4]) # RIGHT
    bins = np.array([0,
                    1*45.0,   # RIGHT 
                    3*45.0, # UP 
                    5*45.0, # LEFT
                    7*45.0, # DOWN
                    8*45.0]) # RIGHT
    new_ang = np.digitize(new_ang, bins)

    mag_bins = np.array([0,
                    25,   # BLACK 
                    255]) # WHITE
    new_mag = np.digitize(mag, mag_bins)
    
    # new_ang = ang *180/np.pi/2
    # print new_ang
    # new_ang = ang[(ang>=0) & (ang< 1*45)] = 360  # RIGHT
    # new_ang = ang[(ang>=45) & (ang< 3*45)] = 90 # UP
    # new_ang = ang[(ang>=3*45) & (ang< 5*45)] = 180 # LEFT
    # new_ang = ang[(ang>=5*45) & (ang< 7*45)] = 270 # DOWN
    # new_ang = ang[(ang>=7*45) & (ang< 8*45)] = 360 # RIGHT
    # print new_ang
    # new_ang = ang*180/np.pi/2
    # this will change right to 1 , up to 2, left to 3, down to 0 

    # print 'before'
    # print new_ang
    new_ang = np.mod(new_ang, 4) + 1
    # print 'now'
    # print new_ang
    hsv[...,0] = new_ang*255/4 # cv2.normalize(new_ang,None,125,255,cv2.NORM_MINMAX) # will turn to value in "values" and then to color 
    hsv[...,2] = (new_mag-1)*255 #cv2.normalize(mag,None,0,255,cv2.NORM_MINMAX)

    bgr = cv2.cvtColor(hsv,cv2.COLOR_HSV2BGR)
    # cv2.imwrite(ROOT_DIR+'/hsv/%d.png'%cursor,bgr)

    Z = bgr.reshape((-1,3))

    # convert to np.float32
    Z = np.float32(Z)

    # define criteria, number of clusters(K) and apply kmeans()
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, cv2.KMEANS_PP_CENTERS)
    ret,label,center=cv2.kmeans(Z,K,None,criteria,10,cv2.KMEANS_RANDOM_CENTERS)

    # print label

    # hist = centroid_histogram(label)
    # bar = plot_colors(hist, center)
    # cv2.imwrite(DIR+'/tests/58d3fef2794f781a395884f7/dominant/%d.png'%cursor,bar)


    # Now convert back into uint8, and make original image
    center = np.uint8(center)
    res = center[label.flatten()]
    res2 = res.reshape((bgr.shape))

    beta = 1-alpha
    dst = frame2
    cv2.addWeighted( frame2, alpha, res2, beta, 0.0, dst);

    cv2.imwrite(ROOT_DIR+'/kmeans/%d.png'%cursor,dst)

    # # calculate optical flow
    # p1, st, err = cv2.calcOpticalFlowPyrLK(prev, next, p0, None, **lk_params)
    # # Select good points
    # good_new = p1[st==1]
    # good_old = p0[st==1]
    # # draw the tracks
    # for i,(new,old) in enumerate(zip(good_new,good_old)):
    #     a,b = new.ravel()
    #     c,d = old.ravel()
    #     mask = cv2.line(mask, (a,b),(c,d), color[i].tolist(), 2)
    #     frame = cv2.circle(frame2,(a,b),5,color[i].tolist(),-1)
    # img = cv2.add(frame,mask)
    # cv2.imwrite(DIR+'/tests/58d3fef2794f781a395884f7/lkd/%d.png'%cursor,img)

    # # Now update the previous frame and previous points
    # p0 = good_new.reshape(-1,1,2)
    prev = next

# cv2.destroyAllWindows()