import cv2
import numpy as np
from sklearn.cluster import KMeans
from scipy import ndimage
import random as rng

def preprocess(img):
    img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    img = cv2.GaussianBlur(img, (9, 9), 0)
    img = img / 255.0
    return img

def kMeans_cluster(img):
    image_2D = img.reshape(img.shape[0] * img.shape[1], img.shape[2])
    kmeans = KMeans(n_clusters=2, random_state=0).fit(image_2D)
    clustOut = kmeans.cluster_centers_[kmeans.labels_]
    clustered_3D = clustOut.reshape(img.shape[0], img.shape[1], img.shape[2])
    clusteredImg = np.uint8(clustered_3D * 255)
    return clusteredImg

def edgeDetection(clusteredImage):
    edged1 = cv2.Canny(clusteredImage, 0, 255)
    edged = cv2.dilate(edged1, None, iterations=1)
    edged = cv2.erode(edged, None, iterations=1)
    return edged

def getBoundingBox(img):
    contours, _ = cv2.findContours(img, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=lambda x: cv2.contourArea(x), reverse=True)
    contours_poly = [cv2.approxPolyDP(c, 3, True) for c in contours]
    boundRect = [cv2.boundingRect(poly) for poly in contours_poly]
    return boundRect, contours, contours_poly, img

def cropOrig(bRect, oimg):
    x, y, w, h = bRect
    pcropedImg = oimg[y:y+h, x:x+w]

    x1, y1, w1, h1 = 0, 0, pcropedImg.shape[1], pcropedImg.shape[0]
    y2 = int(h1 / 10)
    x2 = int(w1 / 10)

    croppedImg = oimg[y + y2: y + h - y2, x + x2: x + w - x2]
    return croppedImg, pcropedImg

def overlayImage(croppedImg, pcropedImg):
    x1, y1, w1, h1 = 0, 0, pcropedImg.shape[1], pcropedImg.shape[0]
    y2 = int(h1 / 10)
    x2 = int(w1 / 10)

    new_image = np.zeros_like(pcropedImg)
    new_image[:, :] = (255, 0, 0)  
    new_image[y2:y2+croppedImg.shape[0], x2:x2+croppedImg.shape[1]] = croppedImg

    return new_image

def estimate_foot_parameters(image):
    preprocessed = preprocess(image)
    clustered = kMeans_cluster(preprocessed)
    edged = edgeDetection(clustered)

    boundRects, contours, contours_poly, _ = getBoundingBox(edged)
    if len(boundRects) < 3:
        return None

    croppedImg, pcropedImg = cropOrig(boundRects[1], clustered)
    newImg = overlayImage(croppedImg, pcropedImg)

    fedged = edgeDetection(newImg)
    fboundRect, fcnt, fcntpoly, fimg = getBoundingBox(fedged)

    if len(fboundRect) < 3:
        return None

    x1, y1, w1, h1 = 0, 0, pcropedImg.shape[1], pcropedImg.shape[0]
    y2 = int(h1 / 10)
    x2 = int(w1 / 10)

    foot_height = y2 + fboundRect[2][3]
    foot_width = x2 + fboundRect[2][2]
    paper_height = pcropedImg.shape[0]
    paper_width = pcropedImg.shape[1]

    # A4 paper actual dimensions in mm
    actual_paper_width = 210
    actual_paper_height = 297

    if foot_width > foot_height:
        foot_size_mm = (actual_paper_height / paper_width) * foot_width
    else:
        foot_size_mm = (actual_paper_height / paper_height) * foot_height

    foot_size_cm = foot_size_mm / 10

    return {
        "foot_height": foot_height,
        "foot_width": foot_width,
        "paper_height": paper_height,
        "paper_width": paper_width,
        "foot_size_cm": round(foot_size_cm, 2)
    }
